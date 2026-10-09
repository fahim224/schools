import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const academicYear = searchParams.get("year") || "1404";

        if (!session || (session.user as any).role !== "STUDENT") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Fetch student with all details, filtered by academic year
        const student = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                phone: true,
                studentId: true,
                fatherName: true,
                grandfatherName: true,
                surname: true,
                tazkiraNo: true,
                nameEn: true,
                fatherNameEn: true,
                grandfatherNameEn: true,
                surnameEn: true,
                permanentAddress: true,
                currentAddress: true,
                paternalUncle: true,
                maternalUncle: true,
                paternalCousin: true,
                maternalCousin: true,
                createdById: true,
                classId: true,
                // Get all enrollments to find years
                enrollments: {
                    select: {
                        academicYear: true,
                        class: {
                            include: {
                                subjects: {
                                    orderBy: { order: 'asc' }
                                }
                            }
                        }
                    }
                },
                // Fetch grades for this year (with fallback for null/unmarked records)
                grades: {
                    where: {
                        OR: [
                            { academicYear: academicYear },
                            { academicYear: null }
                        ]
                    },
                    include: {
                        subject: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                // Fetch attendance for this year
                attendance: {
                    where: {
                        OR: [
                            { academicYear: academicYear },
                            { academicYear: null }
                        ]
                    },
                    orderBy: {
                        type: 'asc'
                    }
                },
                // Fetch gate logs for this year
                gateLogs: {
                    where: {
                        OR: [
                            { academicYear: academicYear },
                            { academicYear: null }
                        ]
                    },
                    orderBy: { timestamp: 'desc' },
                    include: {
                        recordedBy: {
                            select: { name: true }
                        }
                    }
                },
                currentClass: {
                    include: {
                        subjects: {
                            orderBy: { order: 'asc' }
                        }
                    }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ message: "Student not found" }, { status: 404 });
        }

        // Find the class the student was in for this specific academic year
        const selectedYearEnrollment = student.enrollments.find(e => e.academicYear === academicYear);
        let currentYearClass = selectedYearEnrollment?.class || null;

        // Fallback: If no enrollment record for 1404 specifically, check if directly assigned to a 1404 class
        if (!currentYearClass && academicYear === "1404" && (student as any).currentClass?.academicYear === "1404") {
            currentYearClass = (student as any).currentClass;
        }

        // All active years for the selector
        const allYears = Array.from(new Set(student.enrollments.map(e => e.academicYear))).sort().reverse();

        // Fetch announcements
        const creatorId = student.createdById;
        const messages = await prisma.message.findMany({
            where: {
                isVisible: true,
                OR: [
                    { sender: { role: 'SUPERADMIN' } },
                    ...(creatorId ? [{ senderId: creatorId }] : [])
                ],
                AND: [
                    {
                        OR: [
                            { targetRoles: "ALL" },
                            { targetRoles: { contains: "STUDENT" } }
                        ]
                    }
                ]
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                sender: {
                    select: { name: true, role: true, image: true }
                }
            }
        });

        return NextResponse.json({
            student,
            currentYearClass,
            allYears,
            messages
        });
    } catch (error) {
        console.error("Student Dashboard API Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
