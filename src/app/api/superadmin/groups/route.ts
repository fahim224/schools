import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "ADMIN")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const groups = await prisma.studentGroup.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(groups);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching groups" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized. Only SuperAdmins can create groups." }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ message: "Name is required" }, { status: 400 });
        }

        const existing = await prisma.studentGroup.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json({ message: "Group with this name already exists" }, { status: 400 });
        }

        const group = await prisma.studentGroup.create({
            data: { name, description }
        });

        return NextResponse.json(group);
    } catch (error) {
        return NextResponse.json({ message: "Error creating group" }, { status: 500 });
    }
}
