
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { createdById: true, permissions: true }
        });

        if (!user || !user.createdById) {
            return NextResponse.json({ createdBy: null });
        }

        const creator = await prisma.user.findUnique({
            where: { id: user.createdById },
            select: {
                id: true,
                name: true,
                role: true,
                email: true,
                // You might want to fetch school name if it's stored on the creator or settings
            }
        });

        // Also fetch school settings if needed to know school name?
        // Assuming creator IS the admin of the school usually.

        return NextResponse.json({
            createdBy: creator,
            permissions: user.permissions
        });
    } catch (error) {
        console.error("Fetch Creator Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
