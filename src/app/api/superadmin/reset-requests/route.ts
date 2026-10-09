import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const requests = await prisma.passwordResetRequest.findMany({
            where: {
                status: "PENDING",
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        fatherName: true,
                        studentId: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error("Fetch reset requests error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
