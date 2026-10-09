import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeUser } from "@/lib/sanitize-user";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { qrData, scanType } = await req.json();

        // Parse QR code data
        let scannedInfo;
        try {
            scannedInfo = JSON.parse(qrData);
        } catch {
            return NextResponse.json({
                success: false,
                message: "Invalid QR code format"
            }, { status: 400 });
        }

        // Fetch scanned person from database
        const targetUser = await prisma.user.findUnique({
            where: { id: scannedInfo.id },
            include: {
                currentClass: {
                    include: {
                        teacher: {
                            select: { id: true, name: true, email: true, phone: true, image: true }
                        }
                    }
                }
            }
        });

        if (!targetUser) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        const currentUser = session.user as any;
        let isAuthorized = false;
        let schoolId = "";

        // Role-based access control
        if (currentUser.role === "SUPERADMIN") {
            isAuthorized = true;
            schoolId = targetUser.createdById || "";
        }
        else if (currentUser.role === "ADMIN") {
            // Admin can scan anyone in their school
            if (targetUser.createdById === currentUser.id || targetUser.id === currentUser.id) {
                isAuthorized = true;
                schoolId = currentUser.id;
            }
        }
        else if (currentUser.role === "TEACHER") {
            // Teacher can only see students in their class (legacy behavior)
            if (targetUser.role === "STUDENT" && targetUser.currentClass?.teacherId === currentUser.id) {
                isAuthorized = true;
                schoolId = targetUser.createdById || "";
            }
        }
        else if (currentUser.role === "STAFF") {
            // Staff can scan anyone from the same school (created by same admin)
            const staffUser = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { createdById: true }
            });

            if (staffUser?.createdById && targetUser.createdById === staffUser.createdById) {
                isAuthorized = true;
                schoolId = staffUser.createdById;
            }
        }

        if (isAuthorized) {
            // Record Gate Log if scanType is provided
            if (scanType && (currentUser.role === "STAFF" || currentUser.role === "ADMIN")) {
                await prisma.gateLog.create({
                    data: {
                        userId: targetUser.id,
                        type: scanType, // ENTRY or EXIT
                        recordedById: currentUser.id,
                        createdById: schoolId // Link to school admin
                    }
                });
            }

            return NextResponse.json({
                success: true,
                student: sanitizeUser(targetUser),
                message: scanType ? `Successfully recorded ${scanType}` : "User found"
            });
        }

        return NextResponse.json({
            success: false,
            message: "Access denied or user not in your school"
        }, { status: 403 });

    } catch (error) {
        console.error("QR Scan Error:", error);
        return NextResponse.json({
            success: false,
            message: "Internal Server Error"
        }, { status: 500 });
    }
}
