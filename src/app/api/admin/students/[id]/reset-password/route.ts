import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await context.params;

        if (!session || !["ADMIN", "SUPERADMIN", "TEACHER"].includes((session.user as any).role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Find the student
        const student = await prisma.user.findUnique({
            where: { id },
            select: { id: true, studentId: true, role: true }
        });

        if (!student) {
            return NextResponse.json({ message: "Student not found" }, { status: 404 });
        }

        if (student.role !== "STUDENT") {
            return NextResponse.json({ message: "Only student passwords can be reset via this endpoint" }, { status: 400 });
        }

        if (!student.studentId) {
            return NextResponse.json({ message: "Student ID (Basis Number) not found. Password cannot be reset to basis." }, { status: 400 });
        }

        // Reset password to studentId (bcrypt hash)
        const hashedPassword = await bcrypt.hash(student.studentId, 10);

        await prisma.user.update({
            where: { id: student.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Student Password Reset Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
