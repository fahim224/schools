
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const parent = await prisma.user.findUnique({
            where: { id: params.id, role: "PARENT" },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                jobTitle: true,
                permanentAddress: true,
                currentAddress: true,
                children: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        currentClass: {
                            select: {
                                id: true,
                                name: true,
                                level: true,
                                section: true
                            }
                        }
                    }
                }
            }
        });

        if (!parent) {
            return NextResponse.json({ message: "Parent not found" }, { status: 404 });
        }

        return NextResponse.json(parent);
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
