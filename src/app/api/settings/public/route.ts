import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Always return SuperAdmin default settings for public
        let settings = await prisma.schoolSettings.findFirst({
            where: { userId: null },
            select: {
                whatsappNumber: true,
                schoolAddress: true,
                schoolName: true,
            }
        });

        // Create default if doesn't exist
        if (!settings) {
            settings = await prisma.schoolSettings.create({
                data: {
                    userId: null,
                    schoolName: "لیسه عالی خصوصی نیکان",
                    headerTitle1: "وزارت معارف",
                    headerTitle2: "ریاست معارف ولایت کابل",
                    headerTitle3: "آمریت معارف حوزه دوازدهم تعلیمی",
                    whatsappNumber: "0000000000",
                    schoolAddress: "Kabul, Afghanistan"
                },
                select: {
                    whatsappNumber: true,
                    schoolAddress: true,
                    schoolName: true,
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Public Settings Error:", error);
        return NextResponse.json({
            whatsappNumber: "0000000000",
            schoolAddress: "Kabul, Afghanistan",
            schoolName: "لیسه عالی خصوصی نیکان"
        });
    }
}
