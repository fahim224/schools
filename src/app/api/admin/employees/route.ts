import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateQRCode } from "@/lib/qrcode";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        const userId = (session.user as any).id;

        let where: any = {
            role: {
                in: ["TEACHER", "ADMIN", "STAFF"]
            }
        };

        if (role === "ADMIN") {
            // Admin sees employees they created OR employees created by their teachers
            const teachers = await prisma.user.findMany({
                where: { createdById: userId, role: "TEACHER" },
                select: { id: true }
            });
            const teacherIds = teachers.map(t => t.id);
            where.createdById = { in: [userId, ...teacherIds] };
        } else if (role === "TEACHER") {
            // Teacher sees parents/staff from their creator
            const teacher = await prisma.user.findUnique({
                where: { id: userId },
                select: { createdById: true }
            });

            if (teacher?.createdById) {
                where.createdById = teacher.createdById;
            } else {
                // Self-registered teacher: show SuperAdmin created employees
                const superAdmins = await prisma.user.findMany({
                    where: { role: "SUPERADMIN" },
                    select: { id: true }
                });
                where.createdById = { in: superAdmins.map(s => s.id) };
            }
        } else if (role === "SUPERADMIN") {
            // SuperAdmin sees all
            where = {
                role: { in: ["TEACHER", "ADMIN", "STAFF"] }
            };
        } else {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const employees = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                phone: true,
                qrCode: true,
                createdAt: true,
                _count: {
                    select: {
                        subjects: true,
                        managedClasses: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(employees);
    } catch (error) {
        console.error("Fetch Employees Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const data = await req.json();

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const {
            name,
            email,
            password,
            role,
            phone,
            jobTitle,
            childIds // Array of student user IDs
        } = data;

        if (!name || !role || !password) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const employee = await prisma.user.create({
            data: {
                name,
                email: email || `${name.toLowerCase().replace(/\s+/g, '')}@maktabyar.com`,
                password: hashedPassword,
                role: role,
                phone: phone,
                createdById: (session.user as any).id,
                // If it's a parent, link the requested children
                ...(role === "PARENT" && childIds && childIds.length > 0 ? {
                    children: {
                        connect: childIds.map((id: string) => ({ id }))
                    }
                } : {})
            },
            include: {
                children: true
            }
        });

        // Generate QR Code for the employee
        const qrCode = await generateQRCode({
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            createdAt: employee.createdAt
        });

        // Update employee with QR code
        const updatedEmployee = await prisma.user.update({
            where: { id: employee.id },
            data: { qrCode }
        });

        // Remove password from response
        const { password: _, ...employeeWithoutPassword } = updatedEmployee;

        return NextResponse.json({ message: "Employee registered successfully", employee: employeeWithoutPassword }, { status: 201 });
    } catch (error: any) {
        console.error("Employee Registration Error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ message: "Email already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
