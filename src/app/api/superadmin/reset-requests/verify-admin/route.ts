import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { password } = await req.json();

        if (!password) {
            return NextResponse.json({ error: "Password is required" }, { status: 400 });
        }

        const admin = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
        });

        if (!admin || !admin.password) {
            return NextResponse.json({ error: "Admin not found" }, { status: 404 });
        }

        const isValid = await bcrypt.compare(password, admin.password);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid password" }, { status: 403 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Verify admin error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
