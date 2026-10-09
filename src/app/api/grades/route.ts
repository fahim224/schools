import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getManagedClass } from "@/lib/class-access";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");
    const type = searchParams.get("type");

    if (!classId) {
        return NextResponse.json({ message: "Missing classId" }, { status: 400 });
    }

    const access = await getManagedClass(classId, session.user as any);
    if (!access.schoolClass) {
        return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }
    if (!access.allowed) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const where: any = { classId };
    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type;

    try {
        const grades = await prisma.grade.findMany({
            where: where
        });
        return NextResponse.json(grades);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching grades" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { classId, subjectId, type, grades, bulkGrades } = body;

        // Fetch academic year from class for synchronization
        const targetClassId = classId || (bulkGrades && bulkGrades.length > 0 ? bulkGrades[0].classId : null);
        if (!targetClassId || typeof targetClassId !== "string") {
            return NextResponse.json({ message: "Missing classId" }, { status: 400 });
        }

        const access = await getManagedClass(targetClassId, session.user as any);
        if (!access.schoolClass) {
            return NextResponse.json({ message: "Class not found" }, { status: 404 });
        }
        if (!access.allowed) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
        const academicYear = access.schoolClass.academicYear || "1404";

        // Support for bulk grades (multiple subjects/types)
        if (bulkGrades && Array.isArray(bulkGrades)) {
            if (bulkGrades.some((g: any) => g.classId && g.classId !== targetClassId)) {
                return NextResponse.json({ message: "All grades must belong to the selected class" }, { status: 400 });
            }

            await prisma.$transaction(
                bulkGrades.map((g: any) =>
                    prisma.grade.upsert({
                        where: {
                            studentId_subjectId_classId_type: {
                                studentId: g.studentId,
                                subjectId: g.subjectId,
                                classId: targetClassId,
                                type: g.type
                            }
                        },
                        update: {
                            score: Number(g.score) || 0,
                            academicYear: academicYear
                        },
                        create: {
                            studentId: g.studentId,
                            subjectId: g.subjectId,
                            classId: targetClassId,
                            type: g.type,
                            score: Number(g.score) || 0,
                            academicYear: academicYear
                        }
                    })
                )
            );
            return NextResponse.json({ message: "Bulk grades saved successfully" });
        }

        // Legacy single subject/type support
        if (!classId || !subjectId || !type || !Array.isArray(grades)) {
            console.error("Invalid single-grade payload: Missing required fields");
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        await prisma.$transaction(
            grades.map((g: any) =>
                prisma.grade.upsert({
                    where: {
                        studentId_subjectId_classId_type: {
                            studentId: g.studentId,
                            subjectId,
                            classId,
                            type
                        }
                    },
                    update: {
                        score: Number(g.score) || 0,
                        academicYear: academicYear
                    },
                    create: {
                        studentId: g.studentId,
                        subjectId,
                        classId,
                        type,
                        score: Number(g.score) || 0,
                        academicYear: academicYear
                    }
                })
            )
        );

        return NextResponse.json({ message: "Grades saved successfully" });
    } catch (error: any) {
        console.error("Error saving grades (TRANSACTION ERROR):", error);
        return NextResponse.json({ message: "Error saving grades" }, { status: 500 });
    }
}
