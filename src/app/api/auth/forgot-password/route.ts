import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({
                message: "اگر حسابی با این ایمیل موجود باشد، درخواست بازیابی ثبت می‌شود."
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600000 * 24); // 24 hours expiry for admin flow

        await prisma.passwordResetRequest.create({
            data: {
                userId: user.id,
                token: token,
                expiresAt: expires,
            },
        });

        return NextResponse.json({
            message: "درخواست شما ثبت شد. لطفا برای دریافت لینک بازیابی با مدیریت (سوپرادمین) تماس بگیرید."
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
