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
    const studentId = searchParams.get("studentId");
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
    if (studentId) where.studentId = studentId;
    if (type) where.type = type;

    try {
        const attendance = await prisma.attendance.findMany({
            where: where
        });
        return NextResponse.json(attendance);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching attendance" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { classId, bulkAttendance } = body;

        if (!classId || !Array.isArray(bulkAttendance)) {
            console.error("Invalid attendance payload: Missing classId or bulkAttendance is not an array");
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        // Fetch academic year from class for synchronization
        const access = await getManagedClass(classId, session.user as any);
        if (!access.schoolClass) {
            return NextResponse.json({ message: "Class not found" }, { status: 404 });
        }
        if (!access.allowed) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
        if (bulkAttendance.some((a: any) => a.classId && a.classId !== classId)) {
            return NextResponse.json({ message: "All attendance records must belong to the selected class" }, { status: 400 });
        }
        const academicYear = access.schoolClass.academicYear || "1404";

        await prisma.$transaction(
            bulkAttendance.map((a: any) =>
                prisma.attendance.upsert({
                    where: {
                        studentId_classId_type: {
                            studentId: a.studentId,
                            classId,
                            type: a.type
                        }
                    },
                    update: {
                        days: a.days !== undefined ? Math.floor(Number(a.days) || 0) : 0,
                        present: a.present !== undefined ? Math.floor(Number(a.present) || 0) : 0,
                        absent: a.absent !== undefined ? Math.floor(Number(a.absent) || 0) : 0,
                        sick: a.sick !== undefined ? Math.floor(Number(a.sick) || 0) : 0,
                        leave: a.leave !== undefined ? Math.floor(Number(a.leave) || 0) : 0,
                        remarks: a.remarks || null,
                        academicYear: academicYear
                    },
                    create: {
                        studentId: a.studentId,
                        classId,
                        type: a.type,
                        days: a.days !== undefined ? Math.floor(Number(a.days) || 0) : 0,
                        present: a.present !== undefined ? Math.floor(Number(a.present) || 0) : 0,
                        absent: a.absent !== undefined ? Math.floor(Number(a.absent) || 0) : 0,
                        sick: a.sick !== undefined ? Math.floor(Number(a.sick) || 0) : 0,
                        leave: a.leave !== undefined ? Math.floor(Number(a.leave) || 0) : 0,
                        remarks: a.remarks || null,
                        academicYear: academicYear
                    }
                })
            )
        );

        return NextResponse.json({ message: "Attendance saved successfully" });
    } catch (error: any) {
        console.error("Error saving attendance (TRANSACTION ERROR):", error);
        return NextResponse.json({ message: "Error saving attendance" }, { status: 500 });
    }
}
