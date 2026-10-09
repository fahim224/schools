import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { sanitizeUser } from "@/lib/sanitize-user";

// GET a single student
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const role = (session.user as any).role;
        const userId = (session.user as any).id;
        const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

        const student = await prisma.user.findFirst({
            where: {
                id: id,
                role: "STUDENT",
                ...(role === "ADMIN" ? { createdById: userId } :
                    role === "TEACHER" ? {
                        OR: [
                            { createdById: userId },
                            { currentClass: { teacherId: userId } },
                            { enrollments: { some: { class: { teacherId: userId } } } }
                        ]
                    } : {})
            },
            include: {
                currentClass: true,
                enrollments: {
                    include: { class: true },
                    orderBy: { academicYear: 'desc' }
                },
                grades: {
                    include: { subject: true, class: true },
                    orderBy: { createdAt: 'desc' }
                },
                attendance: {
                    include: { class: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ message: "Student not found" }, { status: 404 });
        }

        return NextResponse.json(sanitizeUser(student));
    } catch (error) {
        console.error("Fetch Student Detail Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// UPDATE a student
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();
        const role = (session.user as any).role;
        const userId = (session.user as any).id;
        const isAdmin = role === "ADMIN";

        // Check if student exists and user has permission
        const student = await prisma.user.findFirst({
            where: {
                id: id,
                role: "STUDENT",
                ...(role === "ADMIN" ? { createdById: userId } :
                    role === "TEACHER" ? {
                        OR: [
                            { createdById: userId },
                            { currentClass: { teacherId: userId } },
                            { enrollments: { some: { class: { teacherId: userId } } } }
                        ]
                    } : {})
            }
        });

        if (!student) {
            return NextResponse.json({ message: "Student not found" }, { status: 404 });
        }

        const { fatherName, grandfatherName, phone, ...otherData } = data;

        // 1. Get current parent association
        const currentStudent = await prisma.user.findUnique({
            where: { id },
            include: { parents: { include: { children: true } } }
        });

        const oldParent = currentStudent?.parents?.[0];

        // 2. Search for a potential matching parent with the NEW info
        let targetParent = null;
        if (phone) {
            targetParent = await prisma.user.findFirst({
                where: { role: "PARENT", phone: phone }
            });
        }

        if (!targetParent && fatherName) {
            targetParent = await prisma.user.findFirst({
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

        // 3. Update Student data
        const updatedStudent = await prisma.user.update({
            where: { id: id },
            data: {
                ...otherData,
                fatherName,
                grandfatherName,
                phone,
                groupId: data.groupId,
                role: "STUDENT"
            },
            include: { parents: true }
        });

        // 3.5. Delete old image if new one is provided and saved
        if (data.image && student.image && student.image !== data.image && student.image.startsWith("/uploads/")) {
            const oldImagePath = join(process.cwd(), "public", student.image);
            if (existsSync(oldImagePath)) {
                await unlink(oldImagePath).catch(err => console.error("Old image delete error:", err));
            }
        }

        // 4. Handle Parent Linkage
        if (targetParent) {
            // Case A: Found a match (either existing parent or the current one)
            if (oldParent && oldParent.id !== targetParent.id) {
                // Relink: Disconnect from old, connect to new
                await prisma.user.update({
                    where: { id: id },
                    data: {
                        parents: {
                            disconnect: { id: oldParent.id },
                            connect: { id: targetParent.id }
                        }
                    }
                });
            } else if (!oldParent) {
                // Just connect
                await prisma.user.update({
                    where: { id: id },
                    data: {
                        parents: { connect: { id: targetParent.id } }
                    }
                });
            }

            // Sync target parent info just in case
            await prisma.user.update({
                where: { id: targetParent.id },
                data: {
                    name: fatherName || targetParent.name,
                    phone: phone || targetParent.phone,
                    grandfatherName: grandfatherName || targetParent.grandfatherName
                }
            });

        } else if (oldParent) {
            // Case B & C: No match found, but student was linked to someone

            if (oldParent.children.length > 1) {
                // Case B: Parent has more than one child. We separate this student and create a NEW parent profile.
                await prisma.user.update({
                    where: { id: id },
                    data: {
                        parents: { disconnect: { id: oldParent.id } }
                    }
                });

                // Create private new parent for this student
                const parentPassword = await bcrypt.hash("maktabyar123", 10);
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                await prisma.user.create({
                    data: {
                        name: fatherName,
                        phone: phone || undefined,
                        grandfatherName: grandfatherName || undefined,
                        password: parentPassword,
                        role: "PARENT",
                        isActive: true,
                        email: `parent_${randomSuffix}@maktabyar.com`,
                        children: { connect: { id: id } }
                    }
                });
            } else {
                // Case C: This is the ONLY child of that parent. We just update the parent profile.
                await prisma.user.update({
                    where: { id: oldParent.id },
                    data: {
                        name: fatherName || oldParent.name,
                        phone: phone || oldParent.phone,
                        grandfatherName: grandfatherName || oldParent.grandfatherName
                    }
                });
            }
        }

        return NextResponse.json(sanitizeUser(updatedStudent));
    } catch (error) {
        console.error("Update Student Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE a student
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const isAdmin = (session.user as any).role === "ADMIN";
        const userId = (session.user as any).id;

        // Check if student exists
        const student = await prisma.user.findFirst({
            where: {
                id: id,
                role: "STUDENT",
            }
        });

        if (!student) {
            return NextResponse.json({ message: "Student not found" }, { status: 404 });
        }

        // Ownership check: SUPERADMIN can delete anyone. ADMIN can delete if they created the student.
        if ((session.user as any).role === "ADMIN" && student.createdById !== userId) {
            return NextResponse.json({ message: "You don't have permission to delete this student" }, { status: 403 });
        }

        // Use transaction to ensure all related data is cleaned up
        await prisma.$transaction([
            prisma.grade.deleteMany({ where: { studentId: id } }),
            prisma.attendance.deleteMany({ where: { studentId: id } }),
            prisma.enrollment.deleteMany({ where: { studentId: id } }),
            prisma.gateLog.deleteMany({ where: { userId: id } }),
            prisma.message.deleteMany({ where: { senderId: id } }),
            prisma.user.delete({ where: { id: id } })
        ]);

        // Delete student image from disk
        if (student.image && student.image.startsWith("/uploads/")) {
            const imagePath = join(process.cwd(), "public", student.image);
            if (existsSync(imagePath)) {
                await unlink(imagePath).catch(err => console.error("Image delete error during student deletion:", err));
            }
        }

        return NextResponse.json({ message: "Student deleted successfully" });
    } catch (error) {
        console.error("Delete Student Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
