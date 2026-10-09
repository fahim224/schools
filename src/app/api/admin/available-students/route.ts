import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;

        // Get the current user's creator info
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, createdById: true, role: true }
        });

        let creatorIds: string[] = [];

        if (userRole === "SUPERADMIN") {
            // SuperAdmin sees all students
            const allCreators = await prisma.user.findMany({
                where: { role: { in: ["SUPERADMIN", "ADMIN", "TEACHER"] } },
                select: { id: true }
            });
            creatorIds = allCreators.map(c => c.id);
        } else if (userRole === "ADMIN") {
            // Admin sees students created by themselves or superadmin
            const creators = await prisma.user.findMany({
                where: {
                    OR: [
                        { role: "SUPERADMIN" },
                        { id: userId }
                    ]
                },
                select: { id: true }
            });
            creatorIds = creators.map(c => c.id);
        } else if (userRole === "TEACHER") {
            // Teacher logic:
            // If teacher has a creator (was registered by admin), show students from that creator
            // If teacher has no creator (self-registered), show only their own students
            if (currentUser?.createdById) {
                // Teacher was registered by an admin - show students from that admin
                creatorIds = [currentUser.createdById];
            } else {
                // Self-registered teacher - show only their own students
                creatorIds = [userId];
            }
        }

        const { searchParams } = new URL(req.url);
        const year = searchParams.get("year");

        // Find students who are NOT in any class (for that specific year if provided)
        const students = await prisma.user.findMany({
            where: {
                role: "STUDENT",
                ...(year ? {
                    enrollments: {
                        none: { academicYear: year }
                    }
                } : {
                    classId: null
                }),
                createdById: { in: creatorIds }
            },
            select: {
                id: true,
                name: true,
                studentId: true,
                fatherName: true,
                image: true
            },
            orderBy: {
                name: "asc"
            }
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error("Fetch Available Students Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
