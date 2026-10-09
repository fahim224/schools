import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const settings = await prisma.schoolSettings.findUnique({
            where: { userId },
            select: { isIdCardEnabled: true, idCardDesign: true }
        });

        if (!settings) {
            return NextResponse.json({ message: "Settings not found" }, { status: 404 });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("ID Card Settings GET Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const data = await req.json();

        // Admins can only update their idCardDesign design, not the isIdCardEnabled
        // isIdCardEnabled is controlled by SuperAdmin
        const { idCardDesign } = data;

        const updatedSettings = await prisma.schoolSettings.update({
            where: { userId },
            data: { idCardDesign }
        });

        return NextResponse.json({ message: "ID Card design saved successfully", idCardDesign: updatedSettings.idCardDesign });
    } catch (error) {
        console.error("ID Card Settings POST Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
