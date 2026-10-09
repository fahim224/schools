import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { studentIds, targetClassId, academicYear } = await req.json();

        if (!studentIds || !targetClassId || !academicYear) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Verify target class exists
        const targetClass = await prisma.schoolClass.findUnique({
            where: { id: targetClassId }
        });

        if (!targetClass) {
            return NextResponse.json({ message: "Target class not found" }, { status: 404 });
        }

        const results = await prisma.$transaction(async (tx) => {
            const promotions = [];

            for (const studentId of studentIds) {
                // 1. Create or Update Enrollment for the new year
                const enrollment = await tx.enrollment.upsert({
                    where: {
                        studentId_academicYear: {
                            studentId,
                            academicYear
                        }
                    },
                    update: {
                        classId: targetClassId
                    },
                    create: {
                        studentId,
                        classId: targetClassId,
                        academicYear
                    }
                });

                // Enrollment record tracks their membership for the specific year
                // so they stay in the previous class's history for the previous year.
                promotions.push(enrollment);
            }

            return promotions;
        });

        return NextResponse.json({
            message: `Successfully promoted ${results.length} students to ${targetClass.level} ${targetClass.section} for year ${academicYear}`,
            count: results.length
        });

    } catch (error: any) {
        console.error("Promotion Error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
