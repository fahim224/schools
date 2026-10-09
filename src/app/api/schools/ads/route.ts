import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Fetch all admins who have school settings that are APPROVED for ads
        const schoolAds = await prisma.schoolSettings.findMany({
            where: {
                isAdApproved: true,
                adBanner: { not: null }, // Must have a banner
            },
            select: {
                id: true,
                schoolName: true,
                schoolLogo: true,
                adBanner: true,
                adTitle: true,
                adDescription: true,
                whatsappNumber: true,
                schoolAddress: true,
            },
            take: 6, // Limit to 6 featured ads
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(schoolAds);
    } catch (error) {
        console.error("Error fetching school ads:", error);
        return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
    }
}
