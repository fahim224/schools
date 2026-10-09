import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "ADMIN")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { name } = await req.json();

        if ((session.user as any).role === "ADMIN") {
            // Only allow updating if they created it
            const subject = await prisma.subject.findUnique({
                where: { id },
                select: { createdById: true }
            });
            if (subject?.createdById !== (session.user as any).id) {
                return NextResponse.json({ message: "Forbidden" }, { status: 403 });
            }
        }

        const subject = await prisma.subject.update({
            where: { id },
            data: { name }
        });
        return NextResponse.json(subject);
    } catch (error) {
        console.error("Update Subject Error:", error);
        return NextResponse.json({ message: "Error updating subject" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "ADMIN")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        if ((session.user as any).role === "ADMIN") {
            const subject = await prisma.subject.findUnique({
                where: { id },
                select: { createdById: true }
            });
            if (subject?.createdById !== (session.user as any).id) {
                return NextResponse.json({ message: "Forbidden" }, { status: 403 });
            }
        }

        await prisma.subject.delete({
            where: { id }
        });
        return NextResponse.json({ message: "Subject deleted" });
    } catch (error) {
        console.error("Delete Subject Error:", error);
        return NextResponse.json({ message: "Error deleting subject" }, { status: 500 });
    }
}
