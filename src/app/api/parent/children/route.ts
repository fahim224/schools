
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sanitizeUser } from "@/lib/sanitize-user";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "PARENT") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const parentId = (session.user as any).id;

        const parent = await prisma.user.findUnique({
            where: { id: parentId },
            include: {
                children: {
                    include: {
                        currentClass: true,
                        grades: {
                            include: { subject: true, class: true },
                            orderBy: { createdAt: 'desc' }
                        },
                        attendance: {
                            include: { class: true },
                            orderBy: { createdAt: 'desc' }
                        },
                        gateLogs: {
                            orderBy: { timestamp: 'desc' },
                            take: 50 // Latest 50 logs
                        },
                        enrollments: {
                            include: { class: true },
                            orderBy: { academicYear: 'desc' }
                        }
                    }
                }
            }
        });

        if (!parent) {
            return NextResponse.json({ message: "Parent not found" }, { status: 404 });
        }

        return NextResponse.json(parent.children.map(sanitizeUser));
    } catch (error) {
        console.error("Fetch Parent Children Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
