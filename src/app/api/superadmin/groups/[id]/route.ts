import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.studentGroup.delete({
            where: { id }
        });
        return NextResponse.json({ message: "Group deleted successfully" });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting group" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description } = body;

    try {
        const updated = await prisma.studentGroup.update({
            where: { id },
            data: { name, description }
        });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ message: "Error updating group" }, { status: 500 });
    }
}
