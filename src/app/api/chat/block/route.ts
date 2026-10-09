import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { targetId, action } = body;

        if (!targetId || !action) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        const userId = (session.user as any).id;

        if (action === "block") {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    blockedUsers: {
                        connect: { id: targetId }
                    }
                }
            });
        } else if (action === "unblock") {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    blockedUsers: {
                        disconnect: { id: targetId }
                    }
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Block/Unblock Error:", error);
        return NextResponse.json({ message: "Error updating block status" }, { status: 500 });
    }
}
