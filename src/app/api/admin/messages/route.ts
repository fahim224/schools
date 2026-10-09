
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "SUPERADMIN")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { content, targetRoles } = body;

        if (!content) return NextResponse.json({ message: "Content required" }, { status: 400 });

        const message = await prisma.message.create({
            data: {
                content,
                targetRoles: targetRoles || "TEACHER", // Default to TEACHER if Admin
                senderId: (session.user as any).id,
                isVisible: true
            }
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error("Message Post Error:", error);
        return NextResponse.json({ message: "Failed to post message" }, { status: 500 });
    }
}
