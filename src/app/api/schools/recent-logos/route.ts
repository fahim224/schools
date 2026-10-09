import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Get all admins
        const admins = await prisma.user.findMany({
            where: {
                role: "ADMIN",
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        // For each admin, get their settings and student count
        const schoolsData = await Promise.all(
            admins.map(async (admin) => {
                // Count students created by this admin
                const studentCount = await prisma.user.count({
                    where: {
                        role: "STUDENT",
                        createdById: admin.id,
                    }
                });

                // Get admin's own settings
                const settings: any = await prisma.schoolSettings.findUnique({
                    where: { userId: admin.id },
                    select: {
                        schoolName: true,
                        schoolLogo: true,
                    }
                });

                // If admin has settings with a logo, include them
                if (settings?.schoolLogo) {
                    return {
                        id: admin.id,
                        name: settings.schoolName || admin.name,
                        image: settings.schoolLogo,
                        studentCount,
                    };
                }

                return null;
            })
        );

        // Filter, sort by student count, and return top 10
        const validSchools = schoolsData
            .filter(s => s !== null)
            .sort((a, b) => b!.studentCount - a!.studentCount)
            .slice(0, 10);

        return NextResponse.json(validSchools);
    } catch (error) {
        console.error("Error fetching school logos:", error);
        return NextResponse.json([], { status: 200 });
    }
}
