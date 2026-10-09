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

    const superAdmins = await prisma.user.findMany({
        where: { role: "SUPERADMIN" },
        select: { id: true }
    });
    const superAdminIds = superAdmins.map(s => s.id);

    if (role === "ADMIN") {
        // Admin sees subjects they created OR global subjects (SuperAdmin)
        where.createdById = { in: [userId, ...superAdminIds] };
    } else if (role === "TEACHER") {
        // Teacher sees subjects from their creator OR global subjects (SuperAdmin)
        const teacher = await prisma.user.findUnique({
            where: { id: userId },
            select: { createdById: true }
        });

        const authorizedIds = [...superAdminIds];
        if (teacher?.createdById) authorizedIds.push(teacher.createdById);

        where.createdById = { in: authorizedIds };
    } else if (role === "SUPERADMIN") {
        where = {};
    }

    const subjects = await prisma.subject.findMany({
        where,
        include: { teacher: true },
        orderBy: [
            { order: 'asc' },
            { name: 'asc' }
        ]
    });
    return NextResponse.json(subjects);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "ADMIN")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json({ message: "Subject name is required" }, { status: 400 });
        }

        // Get count to set order at the end
        const count = await prisma.subject.count();

        const subject = await prisma.subject.create({
            data: {
                name,
                order: count,
                createdById: (session.user as any).id
            }
        });
        return NextResponse.json(subject);
    } catch (error) {
        console.error("Error creating subject:", error);
        return NextResponse.json({ message: "Error creating subject" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "ADMIN")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { orders } = body; // Array of { id: string, order: number }

        if (!Array.isArray(orders)) {
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        await prisma.$transaction(
            orders.map((o) =>
                prisma.subject.update({
                    where: { id: o.id },
                    data: { order: o.order }
                })
            )
        );

        return NextResponse.json({ message: "Order updated" });
    } catch (error) {
        console.error("Error updating subject order:", error);
        return NextResponse.json({ message: "Error updating order" }, { status: 500 });
    }
}
