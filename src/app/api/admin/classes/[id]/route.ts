import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET a single class detail
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const schoolClass = await prisma.schoolClass.findUnique({
            where: { id },
            include: {
                teacher: { select: { id: true, name: true, email: true } },
                subjects: {
                    select: { id: true, name: true, order: true },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!schoolClass) {
            return NextResponse.json({ message: "Class not found" }, { status: 404 });
        }

        // Get current user info to determine filtering
        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, createdById: true, role: true }
        });

        // Determine which creator IDs are allowed
        let allowedCreatorIds: string[] = [];

        if (userRole === "SUPERADMIN") {
            const allCreators = await prisma.user.findMany({
                where: { role: { in: ["SUPERADMIN", "ADMIN", "TEACHER"] } },
                select: { id: true }
            });
            allowedCreatorIds = allCreators.map(c => c.id);
        } else if (userRole === "ADMIN") {
            const creators = await prisma.user.findMany({
                where: {
                    OR: [
                        { role: "SUPERADMIN" },
                        { id: userId }
                    ]
                },
                select: { id: true }
            });
            allowedCreatorIds = creators.map(c => c.id);
        } else if (userRole === "TEACHER") {
            if (currentUser?.createdById) {
                allowedCreatorIds = [currentUser.createdById];
            } else {
                allowedCreatorIds = [userId];
            }
        }

        // Fetch enrollments for this class filtered by academicYear
        const enrollments = await prisma.enrollment.findMany({
            where: {
                classId: id,
                ...(schoolClass.academicYear ? { academicYear: schoolClass.academicYear } : {})
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        studentId: true,
                        fatherName: true,
                        grandfatherName: true,
                        tazkiraNo: true,
                        image: true,
                        createdById: true
                    }
                }
            }
        });

        // Filter by access permission (creator)
        const students = enrollments
            .filter(en => en.student && allowedCreatorIds.includes(en.student.createdById ?? ""))
            .map(en => ({
                id: en.student.id,
                name: en.student.name,
                studentId: en.student.studentId,
                fatherName: en.student.fatherName,
                grandfatherName: en.student.grandfatherName,
                tazkiraNo: en.student.tazkiraNo,
                image: en.student.image
            }));

        return NextResponse.json({
            ...schoolClass,
            students,
            enrollments: undefined
        });
    } catch (error) {
        console.error("Fetch Class Detail Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// UPDATE a class
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();
        const { section, gender, teacherId, studentIds, subjectIds, academicYear, level, isActive } = data;

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;

        // Verify class exists first
        const currentClass = await prisma.schoolClass.findUnique({ where: { id } });
        if (!currentClass) {
            return NextResponse.json({ message: "Class not found" }, { status: 404 });
        }

        // Check for duplicates if level/section/gender/academicYear is changed
        if (level || section || gender || academicYear) {
            const checkLevel = level || currentClass.level;
            const checkSection = section || currentClass.section;
            const checkGender = gender || currentClass.gender;
            const checkYear = academicYear || currentClass.academicYear;

            const existing = await prisma.schoolClass.findFirst({
                where: {
                    level: checkLevel,
                    section: checkSection,
                    gender: checkGender,
                    academicYear: checkYear,
                    createdById: currentClass.createdById,
                    id: { not: id }
                }
            });

            if (existing) {
                return NextResponse.json({ message: "A class with same details already exists for this year." }, { status: 400 });
            }
        }

        // If it's a teacher, check if they have a manager (principal)
        if (userRole === "TEACHER") {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { createdById: true }
            });

            // If they have a manager, they cannot edit classes
            if (currentUser?.createdById) {
                return NextResponse.json({ message: "Forbidden: Managed teachers cannot edit classes" }, { status: 403 });
            }
        }

        const updatedClass = await prisma.schoolClass.update({
            where: { id },
            data: {
                section: section,
                gender: gender,
                level: level,
                teacherId: teacherId || null,
                academicYear: academicYear || "1403",
                name: `${level || currentClass.level} - ${section || currentClass.section}`,
                isActive: isActive !== undefined ? isActive : undefined,
                // Students are managed via the Enrollment table below for historical tracking
                ...(subjectIds !== undefined && {
                    subjects: {
                        set: subjectIds.map((sId: string) => ({ id: sId }))
                    }
                })
            }
        });

        // 3. Sync historical enrollment records
        if (studentIds !== undefined && academicYear) {
            // Remove students who are no longer in this class for this year
            await prisma.enrollment.deleteMany({
                where: {
                    classId: id,
                    academicYear: academicYear,
                    studentId: { notIn: studentIds }
                }
            });

            // Add/Update current selection
            await Promise.all(studentIds.map((sId: string) =>
                prisma.enrollment.upsert({
                    where: { studentId_academicYear: { studentId: sId, academicYear: academicYear } },
                    update: { classId: updatedClass.id },
                    create: { studentId: sId, classId: updatedClass.id, academicYear: academicYear }
                })
            ));
        }

        return NextResponse.json(updatedClass);
    } catch (error) {
        console.error("Update Class Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE a class
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userRole = (session.user as any).role;
        const userId = (session.user as any).id;

        const cls = await prisma.schoolClass.findUnique({ where: { id } });
        if (!cls) {
            return NextResponse.json({ message: "Class not found" }, { status: 404 });
        }

        // Verify ownership for non-superadmins
        if (userRole === "ADMIN") {
            if (cls.createdById !== userId) {
                return NextResponse.json({ message: "Forbidden: You don't own this class" }, { status: 403 });
            }
        } else if (userRole === "TEACHER") {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { createdById: true }
            });
            // Teachers can only delete if they have no creator (independent) AND they created it
            if (currentUser?.createdById || cls.createdById !== userId) {
                return NextResponse.json({ message: "Forbidden: Only independent teachers who created this class can delete it" }, { status: 403 });
            }
        }

        // Use transaction to ensure data integrity
        await prisma.$transaction([
            prisma.grade.deleteMany({ where: { classId: id } }),
            prisma.attendance.deleteMany({ where: { classId: id } }),
            prisma.enrollment.deleteMany({ where: { classId: id } }),
            prisma.schoolClass.delete({ where: { id } })
        ]);

        return NextResponse.json({ message: "Class deleted successfully" });
    } catch (error) {
        console.error("Delete Class Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
