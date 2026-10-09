import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        let settings = await prisma.schoolSettings.findFirst();

        if (!settings) {
            settings = await prisma.schoolSettings.create({
                data: {
                    schoolName: "لیسه عالی خصوصی نیکان",
                    whatsappNumber: "0000000000",
                    schoolAddress: "Kabul, Afghanistan",
                    isChatEnabled: true
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const settings = await prisma.schoolSettings.findFirst();

        if (settings) {
            const updated = await prisma.schoolSettings.update({
                where: { id: settings.id },
                data: {
                    schoolName: body.schoolName,
                    schoolNameEn: body.schoolNameEn,
                    whatsappNumber: body.whatsappNumber,
                    schoolAddress: body.schoolAddress,
                    headerTitle1: body.headerTitle1,
                    headerTitle2: body.headerTitle2,
                    headerTitle3: body.headerTitle3,
                    footerNote: body.footerNote,
                    isChatEnabled: body.isChatEnabled,
                }
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.schoolSettings.create({
                data: {
                    schoolName: body.schoolName,
                    schoolNameEn: body.schoolNameEn,
                    whatsappNumber: body.whatsappNumber,
                    schoolAddress: body.schoolAddress,
                    headerTitle1: body.headerTitle1,
                    headerTitle2: body.headerTitle2,
                    headerTitle3: body.headerTitle3,
                    footerNote: body.footerNote,
                    isChatEnabled: body.isChatEnabled !== undefined ? body.isChatEnabled : true,
                }
            });
            return NextResponse.json(created);
        }
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
