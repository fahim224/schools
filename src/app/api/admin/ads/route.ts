import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const ads = await prisma.schoolSettings.findMany({
            where: {
                isAdRequestActive: true, // Only fetch active requests
            },
            select: {
                id: true,
                schoolName: true,
                adBanner: true,
                adTitle: true,
                adDescription: true,
                isAdApproved: true,
                whatsappNumber: true,
                schoolAddress: true,
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(ads);
    } catch (error) {
        console.error("Error fetching ads:", error);
        return NextResponse.json({ message: "Error fetching ads" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, isAdApproved } = await req.json();

        const updatedAd = await prisma.schoolSettings.update({
            where: { id },
            data: { isAdApproved }
        });

        return NextResponse.json(updatedAd);
    } catch (error) {
        console.error("Error updating ad status:", error);
        return NextResponse.json({ message: "Error updating ad status" }, { status: 500 });
    }
}
