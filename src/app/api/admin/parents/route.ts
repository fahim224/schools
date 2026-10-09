
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        const userId = (session.user as any).id;
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";

        // Global filters: ONLY show parents with children
        const baseWhere: any = {
            role: "PARENT",
            children: { some: {} }
        };

        // Cleanup: Delete parents who have no children (as requested: "باید حذف بشه از سیستم")
        try {
            await prisma.user.deleteMany({
                where: {
                    role: "PARENT",
                    children: { none: {} }
                }
            });
        } catch (cleanupErr) {
            console.error("Cleanup parents error:", cleanupErr);
        }

        const roleConstraints: any = {};
        if (role === "ADMIN") {
            const managedUsers = await prisma.user.findMany({
                where: { createdById: userId },
                select: { id: true }
            });
            const managedUserIds = managedUsers.map(u => u.id);
            const allManagerIds = [userId, ...managedUserIds];

            roleConstraints.OR = [
                { createdById: { in: allManagerIds } },
                { children: { some: { createdById: { in: allManagerIds } } } }
            ];
        } else if (role === "TEACHER") {
            roleConstraints.OR = [
                { createdById: userId },
                { children: { some: { createdById: userId } } },
                { children: { some: { currentClass: { teacherId: userId } } } }
            ];
        }

        let where: any;
        if (search) {
            const searchConditions = [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
                { children: { some: { name: { contains: search } } } }
            ];

            where = {
                AND: [
                    baseWhere,
                    roleConstraints,
                    { OR: searchConditions }
                ]
            };
        } else {
            where = { ...baseWhere, ...roleConstraints };
        }

        const parents = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                createdAt: true,
                children: {
                    select: {
                        id: true,
                        name: true,
                        classId: true,
                        receivedAmount: true,
                        currentClass: {
                            select: { name: true, level: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(parents);

    } catch (error) {
        console.error("Fetch Parents Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
