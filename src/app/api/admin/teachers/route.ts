import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const isAdmin = (session.user as any).role === "ADMIN";
        const userId = (session.user as any).id;

        const teachers = await prisma.user.findMany({
            where: {
                role: "TEACHER",
                isActive: true,
                ...(isAdmin ? { createdById: userId } : {})
            },
            select: {
                id: true,
                name: true,
                email: true
            },
            orderBy: {
                name: "asc"
            }
        });

        return NextResponse.json(teachers);
    } catch (error) {
        console.error("Fetch Teachers Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
