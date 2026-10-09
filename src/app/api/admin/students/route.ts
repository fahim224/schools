
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { generateQRCode } from "@/lib/qrcode";

// GET all students
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        const userId = (session.user as any).id;

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;
        const search = searchParams.get("search") || "";
        const classId = searchParams.get("classId");
        const groupId = searchParams.get("groupId");

        // Build base role-access filter
        let accessFilter: any;
        if (role === "ADMIN") {
            // Admin sees students they created OR students created by users they created (teachers)
            const managedUsers = await prisma.user.findMany({
                where: { createdById: userId },
                select: { id: true }
            });
            const managedUserIds = managedUsers.map(u => u.id);
            accessFilter = {
                OR: [
                    { createdById: userId },
                    { createdById: { in: managedUserIds } }
                ]
            };
        } else if (role === "TEACHER") {
            accessFilter = {
                OR: [
                    { createdById: userId },
                    { currentClass: { teacherId: userId } },
                    { enrollments: { some: { class: { teacherId: userId } } } }
                ]
            };
        } else if (role === "SUPERADMIN") {
            accessFilter = {}; // sees all
        } else {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Build AND conditions array - safely combines all filters
        const andConditions: any[] = [
            { role: "STUDENT" },
            accessFilter
        ];

        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: search } },
                    { studentId: { contains: search } },
                    { fatherName: { contains: search } },
                    { email: { contains: search } }
                ]
            });
        }

        if (classId) {
            andConditions.push({ enrollments: { some: { classId } } });
        }

        if (groupId) {
            andConditions.push({ groupId });
        }

        const where = { AND: andConditions };

        const [students, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    studentId: true,
                    fatherName: true,
                    grandfatherName: true,
                    classId: true,
                    image: true,
                    currentClass: {
                        select: { name: true, level: true }
                    },
                    enrollments: {
                        select: {
                            academicYear: true,
                            class: { select: { name: true, level: true } }
                        },
                        orderBy: { academicYear: "desc" },
                        take: 1
                    },
                    group: {
                        select: { id: true, name: true }
                    },
                    createdAt: true
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            }),
            prisma.user.count({ where })
        ]);

        // Resolve currentClass: use direct relation first, fall back to latest enrollment
        const enrichedStudents = students.map(s => ({
            ...s,
            currentClass: s.currentClass ?? (s.enrollments.length > 0 ? s.enrollments[0].class : null),
            enrollments: undefined
        }));

        return NextResponse.json({
            students: enrichedStudents,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Fetch Students Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// REGISTER a new student
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const {
            name,
            email,
            password,
            fatherName,
            grandfatherName,
            studentId,
            surname,
            tazkiraNo,
            nameEn,
            fatherNameEn,
            grandfatherNameEn,
            surnameEn,
            permanentAddress,
            currentAddress,
            paternalUncle,
            maternalUncle,
            paternalCousin,
            maternalCousin,
            image,
            classId,
            groupId,
            parentPhone,
            parentEmail
        } = data;

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;

        // If it's a teacher, check if they have a manager (principal)
        if (userRole === "TEACHER") {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { createdById: true }
            });

            if (currentUser?.createdById) {
                return NextResponse.json({ message: "Forbidden: Managed teachers cannot register students" }, { status: 403 });
            }
        }

        if (!name || !studentId || !fatherName) {
            return NextResponse.json({ message: "Name, Father Name, and Student ID are required" }, { status: 400 });
        }

        const creatorId = (session.user as any).id;

        const existingStudent = await prisma.user.findFirst({
            where: {
                studentId,
                createdById: creatorId,
                role: "STUDENT"
            }
        });
        if (existingStudent) {
            return NextResponse.json({ message: "Student ID already exists" }, { status: 400 });
        }

        // --- PARENT CREATION/LINKING LOGIC ---
        let parentId = null;
        let parentUser = null;

        if (parentPhone) {
            parentUser = await prisma.user.findFirst({
                where: { role: "PARENT", phone: parentPhone }
            });
        }

        if (!parentUser && fatherName) {
            parentUser = await prisma.user.findFirst({
                where: {
                    role: "PARENT",
                    name: fatherName,
                    OR: [
                        { grandfatherName: grandfatherName || undefined },
                        { children: { some: { grandfatherName: grandfatherName } } }
                    ]
                }
            });
        }

        if (!parentUser) {
            const parentPassword = await bcrypt.hash("maktabyar123", 10);

            let generatedParentEmail = parentEmail;
            if (!generatedParentEmail) {
                if (fatherNameEn) {
                    const sanitizedInfo = fatherNameEn.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
                    generatedParentEmail = `${sanitizedInfo}@maktabyar.com`;
                } else {
                    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                    generatedParentEmail = `parent_${randomSuffix}@maktabyar.com`;
                }
            }

            try {
                parentUser = await prisma.user.create({
                    data: {
                        name: fatherName,
                        email: generatedParentEmail,
                        phone: parentPhone || undefined,
                        grandfatherName: grandfatherName || undefined,
                        password: parentPassword,
                        role: "PARENT",
                        isActive: true
                    }
                });
            } catch (err: any) {
                console.error("Error creating parent:", err);
                if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
                    const retryEmail = `parent_${Math.floor(10000 + Math.random() * 90000)}@maktabyar.com`;
                    try {
                        parentUser = await prisma.user.create({
                            data: {
                                name: fatherName,
                                email: retryEmail,
                                phone: parentPhone || undefined,
                                grandfatherName: grandfatherName || undefined,
                                password: parentPassword,
                                role: "PARENT",
                                isActive: true
                            }
                        });
                    } catch (retryErr) {
                        console.error("Retry parent creation failed:", retryErr);
                    }
                }
            }
        }

        if (parentUser) {
            parentId = parentUser.id;
        }

        const hashedPassword = await bcrypt.hash(password || studentId, 10);

        // Fetch settings to get school name for email domain to separate student accounts globally
        const settings = await prisma.schoolSettings.findUnique({
            where: { userId: creatorId }
        });
        const dynamicDomain = settings?.schoolNameEn
            ? settings.schoolNameEn.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
            : `school${creatorId.substring(0, 5).toLowerCase()}`;

        const finalEmail = email || `${studentId}@${dynamicDomain}.com`;

        const student = await prisma.user.create({
            data: {
                name,
                email: finalEmail,
                password: hashedPassword,
                role: "STUDENT",
                fatherName,
                grandfatherName,
                studentId,
                surname,
                tazkiraNo,
                nameEn,
                fatherNameEn,
                grandfatherNameEn,
                surnameEn,
                permanentAddress,
                currentAddress,
                paternalUncle,
                maternalUncle,
                paternalCousin,
                maternalCousin,
                image,
                classId,
                groupId,
                createdById: (session.user as any).id,
                phone: parentPhone,
                parents: parentId ? { connect: { id: parentId } } : undefined
            },
        });

        const qrCode = await generateQRCode({
            id: student.id,
            name: student.name,
            email: student.email,
            role: student.role,
            studentId: student.studentId,
            createdAt: student.createdAt
        });

        const updatedStudent = await prisma.user.update({
            where: { id: student.id },
            data: { qrCode }
        });

        return NextResponse.json({ message: "Student registered successfully", student: updatedStudent, parentCreated: !!parentUser }, { status: 201 });
    } catch (error) {
        console.error("Student Registration Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
