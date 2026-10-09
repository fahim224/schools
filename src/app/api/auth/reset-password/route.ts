import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
        }

        if (typeof password !== "string" || password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const resetRequest = await prisma.passwordResetRequest.findFirst({
            where: {
                token: token,
                status: "PENDING",
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: { user: true }
        });

        if (!resetRequest) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetRequest.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetRequest.update({
                where: { id: resetRequest.id },
                data: { status: "COMPLETED" },
            })
        ]);

        return NextResponse.json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
