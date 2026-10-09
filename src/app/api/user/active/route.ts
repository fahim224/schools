import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;

        await prisma.user.update({
            where: { id: userId },
            data: { lastActiveAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // Fail silently
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
