import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeUser } from "@/lib/sanitize-user";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany();
        return NextResponse.json(users.map(sanitizeUser));
    } catch (error) {
        console.error("Fetch Users Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { userId, role } = await req.json();

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        return NextResponse.json({ message: "User updated successfully", user: sanitizeUser(user) });
    } catch (error) {
        console.error("Update User Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { userId } = await req.json();
        const currentUser = session.user as any;

        // Fetch the user to be deleted to check its creator
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
            select: { createdById: true }
        });

        if (!userToDelete) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Allow if SUPERADMIN or if current user is the one who created this user
        if (currentUser.role === "SUPERADMIN" || userToDelete.createdById === currentUser.id) {
            await prisma.user.delete({
                where: { id: userId },
            });
            return NextResponse.json({ message: "User deleted successfully" });
        }

        return NextResponse.json({ message: "Permission denied" }, { status: 403 });
    } catch (error) {
        console.error("Delete User Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
