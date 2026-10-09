
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET all classes for the school
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        const userId = (session.user as any).id;

        let where: any = {};

        if (role === "ADMIN") {
            // Admin sees classes they created OR classes created by users they managed (teachers)
            const managedUsers = await prisma.user.findMany({
                where: { createdById: userId },
                select: { id: true }
            });
            const managedUserIds = managedUsers.map(u => u.id);
            where.OR = [
                { createdById: userId },
                { createdById: { in: managedUserIds } }
            ];
        } else if (role === "TEACHER") {
            // Teacher sees classes from their creator OR global classes (SuperAdmin) OR classes they own
            const superAdmins = await prisma.user.findMany({
                where: { role: "SUPERADMIN" },
                select: { id: true }
            });
            const superAdminIds = superAdmins.map(s => s.id);

            // Get the teacher's creator ID
            const teacher = await prisma.user.findUnique({
                where: { id: userId },
                select: { createdById: true }
            });

            const authorizedIds = [...superAdminIds];
            if (teacher?.createdById) authorizedIds.push(teacher.createdById);

            where.OR = [
                { createdById: { in: authorizedIds } },
                { teacherId: userId },
                { createdById: userId }
            ];
        } else if (role === "SUPERADMIN") {
            // SuperAdmin sees everything
            where = {};
        } else {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const classes = await prisma.schoolClass.findMany({
            where,
            include: {
                teacher: {
                    select: { name: true }
                },
                _count: {
                    select: {
                        subjects: true
                    }
                },
                enrollments: {
                    select: { id: true, academicYear: true }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // Inject correct per-year student count
        const enriched = classes.map(cls => ({
            ...cls,
            _count: {
                ...cls._count,
                enrollments: cls.enrollments.filter(e => e.academicYear === cls.academicYear).length
            },
            enrollments: undefined // strip raw enrollments from response
        }));

        return NextResponse.json(enriched);
    } catch (error) {
        console.error("Fetch Classes Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// REGISTER a new class
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const {
            level,
            section,
            gender,
            teacherId,
            studentIds,
            subjectIds,
            academicYear // Added year
        } = data;

        if (!level || !section || !gender) {
            return NextResponse.json({ message: "Missing required fields (level, section, gender)" }, { status: 400 });
        }

        const creatorId = (session.user as any).id;
        const userRole = (session.user as any).role;

        // If it's a teacher, check if they have a manager (principal)
        if (userRole === "TEACHER") {
            const currentUser = await prisma.user.findUnique({
                where: { id: creatorId },
                select: { createdById: true, classLimit: true } as any
            });

            // If they have a manager, they cannot create classes
            if (currentUser?.createdById) {
                return NextResponse.json({ message: "Forbidden: Managed teachers cannot create classes" }, { status: 403 });
            }

            // Check class limit for independent teachers
            const classCount = await prisma.schoolClass.count({
                where: { createdById: creatorId }
            });

            const limit = (currentUser as any)?.classLimit ?? 1;
            if (classCount >= limit) {
                return NextResponse.json({
                    message: `You have reached your limit of ${limit} classes. Please contact the SuperAdmin for more.`
                }, { status: 403 });
            }
        }

        const year = academicYear || "1403"; // Default if not provided

        // 1. Check for duplicates in the SAME year for the SAME school (creator)
        const existingClass = await prisma.schoolClass.findFirst({
            where: {
                level: level,
                section: section,
                academicYear: year,
                createdById: creatorId
            }
        });

        if (existingClass) {
            return NextResponse.json({
                message: `این صنف (${level} - ${section}) برای سال تعلیمی ${year} قبلاً توسط شما ایجاد شده است.`
            }, { status: 400 });
        }



        // 2. Create the SchoolClass
        const newClass = await prisma.schoolClass.create({
            data: {
                name: `${level} - ${section}`,
                level: level,
                section: section,
                gender: gender,
                academicYear: year,
                teacherId: userRole === "TEACHER" ? (teacherId || creatorId) : (teacherId || null),
                createdById: creatorId,
                isActive: true, // New field
                subjects: {
                    connect: (subjectIds || []).map((id: string) => ({ id }))
                },
                students: {
                    connect: (studentIds || []).map((id: string) => ({ id }))
                }
                // Optional: Create initial enrollments for history
            }
        });

        // 3. Create historical enrollment records
        if (studentIds && studentIds.length > 0) {
            await Promise.all(studentIds.map((sId: string) =>
                prisma.enrollment.upsert({
                    where: { studentId_academicYear: { studentId: sId, academicYear: year } },
                    update: { classId: newClass.id },
                    create: { studentId: sId, classId: newClass.id, academicYear: year }
                })
            ));
        }

        return NextResponse.json({ message: "Class created successfully", class: newClass }, { status: 201 });
    } catch (error) {
        console.error("Class Creation Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
