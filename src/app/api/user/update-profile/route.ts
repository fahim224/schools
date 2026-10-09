import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const data = await req.json();
        const { name, currentPassword, newPassword } = data;

        const updateData: any = {};

        // Update name if provided
        if (name) {
            updateData.name = name;
        }

        // Update password if provided
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ message: "Current password is required" }, { status: 400 });
            }

            // Verify current password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true }
            });

            if (!user || !user.password) {
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

            if (!isPasswordValid) {
                return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
