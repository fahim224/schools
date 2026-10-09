import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    let where: any = {};

    if (role === "ADMIN") {
        const creators = await prisma.user.findMany({
            where: {
                OR: [
                    { createdById: userId, role: "TEACHER" },
                    { role: "SUPERADMIN" },
                    { id: userId }
                ]
            },
            select: { id: true }
        });
        const authorizedIds = creators.map(c => c.id);
        where.createdById = { in: authorizedIds };
    } else if (role === "TEACHER") {
        // Teacher sees classes from their creator
        const teacher = await prisma.user.findUnique({
            where: { id: userId },
            select: { createdById: true }
        });

        if (teacher?.createdById) {
            where.createdById = teacher.createdById;
        } else {
            // Self-registered teacher: show SuperAdmin classes
            const superAdmins = await prisma.user.findMany({
                where: { role: "SUPERADMIN" },
                select: { id: true }
            });
            where.createdById = { in: superAdmins.map(s => s.id) };
        }
    }

    const classes = await prisma.schoolClass.findMany({
        where,
        include: {
            teacher: true,
            subjects: { orderBy: { order: 'asc' } },
            students: true,
        },
        orderBy: { name: 'asc' }
    });
    return NextResponse.json(classes);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, level, section, gender, teacherId, subjectIds } = await req.json();
        const newClass = await prisma.schoolClass.create({
            data: {
                name,
                level,
                section,
                gender,
                teacherId: teacherId || null,
                createdById: (session.user as any).id,
                subjects: {
                    connect: (subjectIds || []).map((id: string) => ({ id }))
                }
            },
            include: { teacher: true, subjects: true }
        });
        return NextResponse.json(newClass);
    } catch (error) {
        console.error("Create Class Error:", error);
        return NextResponse.json({ message: "Error creating class" }, { status: 500 });
    }
}
