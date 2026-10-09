import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "ADMIN")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";

    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let condition: any;
        if (isAdmin) {
            const managedUsers = await prisma.user.findMany({
                where: { createdById: userId },
                select: { id: true }
            });
            const managedUserIds = managedUsers.map(u => u.id);
            condition = {
                OR: [
                    { createdById: userId },
                    { createdById: { in: managedUserIds } }
                ]
            };
        } else {
            condition = {};
        }

        const [
            allUsers,
            totalClasses,
            totalSubjects,
            totalAmount,
            dailyVisitors,
            weeklyVisitors,
            monthlyVisitors
        ] = await Promise.all([
            prisma.user.groupBy({
                by: ['role'],
                where: condition as any,
                _count: true
            }),
            prisma.schoolClass.count({ where: condition as any }),
            prisma.subject.count({ where: condition as any }),
            prisma.user.aggregate({
                where: { ...(condition as any), role: "STUDENT" },
                _sum: { receivedAmount: true }
            }),
            // Visitor stats (optional if table exists)
            prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM VisitorLog WHERE timestamp >= '${startOfDay.toISOString()}'`).catch(() => [{ count: 0 }]),
            prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM VisitorLog WHERE timestamp >= '${startOfWeek.toISOString()}'`).catch(() => [{ count: 0 }]),
            prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM VisitorLog WHERE timestamp >= '${startOfMonth.toISOString()}'`).catch(() => [{ count: 0 }]),
        ]);

        const roleCounts: any = {
            SUPERADMIN: 0,
            ADMIN: 0,
            TEACHER: 0,
            STUDENT: 0,
            PARENT: 0,
            STAFF: 0
        };

        allUsers.forEach((group: any) => {
            if (roleCounts.hasOwnProperty(group.role)) {
                roleCounts[group.role] = group._count;
            }
        });

        return NextResponse.json({
            users: roleCounts,
            students: roleCounts.STUDENT,
            teachers: roleCounts.TEACHER,
            admins: roleCounts.ADMIN,
            parents: roleCounts.PARENT,
            staff: roleCounts.STAFF,
            classes: totalClasses,
            subjects: totalSubjects,
            totalAmount: totalAmount._sum.receivedAmount || 0,
            visitors: {
                daily: Number((dailyVisitors as any)[0]?.count || 0),
                weekly: Number((weeklyVisitors as any)[0]?.count || 0),
                monthly: Number((monthlyVisitors as any)[0]?.count || 0)
            }
        });
    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ message: "Error fetching stats" }, { status: 500 });
    }
}
