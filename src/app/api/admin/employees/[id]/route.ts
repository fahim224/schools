import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateQRCode } from "@/lib/qrcode";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// GET a single employee
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const isAdmin = (session.user as any).role === "ADMIN";
        const userId = (session.user as any).id;

        const employee = await prisma.user.findFirst({
            where: {
                id: id,
                role: { in: ["TEACHER", "ADMIN", "STAFF"] },
                ...(isAdmin ? { createdById: userId } : {})
            }
        });

        if (!employee) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        // Generate QR Code if missing
        if (!employee.qrCode) {
            const qrCode = await generateQRCode({
                id: employee.id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
                createdAt: employee.createdAt
            });

            const updatedEmployee = await prisma.user.update({
                where: { id: employee.id },
                data: { qrCode }
            });

            const { password: _, ...result } = updatedEmployee;
            return NextResponse.json(result);
        }

        // Remove password from response
        const { password: _, ...employeeWithoutPassword } = employee;

        return NextResponse.json(employeeWithoutPassword);
    } catch (error) {
        console.error("Fetch Employee Detail Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// UPDATE an employee
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();
        const isAdmin = (session.user as any).role === "ADMIN";
        const userId = (session.user as any).id;

        // Check if employee exists and belongs to this admin
        const employee = await prisma.user.findFirst({
            where: {
                id: id,
                role: { in: ["TEACHER", "ADMIN", "STAFF"] },
                ...(isAdmin ? { createdById: userId } : {})
            }
        });

        if (!employee) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        const { password, ...updateData } = data;

        // Handle password update separately if provided
        if (password) {
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedEmployee = await prisma.user.update({
            where: { id: id },
            data: updateData
        });

        // Delete old image if it's being replaced
        if (data.image && employee.image && employee.image !== data.image && employee.image.startsWith("/uploads/")) {
            const oldImagePath = join(process.cwd(), "public", employee.image);
            if (existsSync(oldImagePath)) {
                await unlink(oldImagePath).catch(err => console.error("Old employee image delete error:", err));
            }
        }

        const { password: _, ...result } = updatedEmployee;

        return NextResponse.json(result);
    } catch (error) {
        console.error("Update Employee Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE an employee
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const isAdmin = (session.user as any).role === "ADMIN";
        const userId = (session.user as any).id;

        // Check if employee exists and belongs to this admin
        const employee = await prisma.user.findFirst({
            where: {
                id: id,
                role: { in: ["TEACHER", "ADMIN", "STAFF"] },
                ...(isAdmin ? { createdById: userId } : {})
            }
        });

        if (!employee) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        await prisma.user.delete({
            where: { id: id }
        });

        // Delete employee image from disk
        if (employee.image && employee.image.startsWith("/uploads/")) {
            const imagePath = join(process.cwd(), "public", employee.image);
            if (existsSync(imagePath)) {
                await unlink(imagePath).catch(err => console.error("Employee image delete error during deletion:", err));
            }
        }

        return NextResponse.json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Delete Employee Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
