import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const cls = await prisma.schoolClass.findUnique({
            where: { id },
            include: { teacher: true, subjects: true, students: true }
        });

        if (!cls) {
            return NextResponse.json({ message: "Class not found" }, { status: 404 });
        }

        return NextResponse.json(cls);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching class" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, level, section, gender, teacherId, subjectIds } = await req.json();
        const { id } = await params;

        const updatedClass = await prisma.schoolClass.update({
            where: { id },
            data: {
                name,
                level,
                section,
                gender,
                teacherId: teacherId || null,
                subjects: {
                    set: (subjectIds || []).map((id: string) => ({ id }))
                }
            }
        } as any); // Using as any because of potential TS lag during generation
        return NextResponse.json(updatedClass);
    } catch (error) {
        console.error("Update Class Error:", error);
        return NextResponse.json({ message: "Error updating class" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.schoolClass.delete({ where: { id } });
        return NextResponse.json({ message: "Class deleted" });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting class" }, { status: 500 });
    }
}
