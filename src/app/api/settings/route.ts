import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userRole = (session?.user as any)?.role;
        const userId = (session?.user as any)?.id;

        let settings = null;

        if (userRole === "ADMIN" || userRole === "TEACHER") {
            // Get admin/teacher's own settings
            settings = await prisma.schoolSettings.findUnique({
                where: { userId: userId }
            });

            // If they don't have settings, get SuperAdmin defaults
            if (!settings) {
                settings = await prisma.schoolSettings.findFirst({
                    where: { userId: null }
                });
            }
        } else if (userRole === "SUPERADMIN") {
            // Get SuperAdmin default settings
            settings = await prisma.schoolSettings.findFirst({
                where: { userId: null }
            });
        } else {
            // For students/parents: get their creator's settings or SuperAdmin defaults
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { createdById: true }
            });

            if (user?.createdById) {
                // Try to get creator's settings (if creator is ADMIN or TEACHER)
                settings = await prisma.schoolSettings.findUnique({
                    where: { userId: user.createdById }
                });
            }

            // Fallback to SuperAdmin defaults
            if (!settings) {
                settings = await prisma.schoolSettings.findFirst({
                    where: { userId: null }
                });
            }
        }

        // Create default SuperAdmin settings if none exist
        if (!settings) {
            settings = await prisma.schoolSettings.create({
                data: {
                    userId: null, // SuperAdmin default
                    schoolName: "لیسه عالی خصوصی نیکان",
                    headerTitle1: "وزارت معارف",
                    headerTitle2: "ریاست معارف ولایت کابل",
                    headerTitle3: "آمریت معارف حوزه دوازدهم تعلیمی",
                }
            });
        }

        // Global override for isChatEnabled
        const globalSettings = await prisma.schoolSettings.findFirst({
            where: { userId: null }
        });

        if (globalSettings && !globalSettings.isChatEnabled) {
            // If global settings exist and chat is disabled, override it in the returned settings
            (settings as any).isChatEnabled = false;
        }

        const canViewAiSecret = ["SUPERADMIN", "ADMIN", "TEACHER"].includes(userRole);
        return NextResponse.json({
            ...settings,
            aiApiKey: canViewAiSecret ? settings.aiApiKey : null,
        });
    } catch (error) {
        console.error("Settings Fetch Error:", error);
        return NextResponse.json({ message: "Error fetching settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    if (!session || (userRole !== "ADMIN" && userRole !== "SUPERADMIN" && userRole !== "TEACHER")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Remove undefined values and clean data
        const cleanData: any = {};
        for (const [key, value] of Object.entries(body)) {
            if (value !== undefined && value !== null && key !== 'id' && key !== 'userId' && key !== 'updatedAt') {
                cleanData[key] = value;
            }
        }

        if (userRole === "SUPERADMIN") {
            // SuperAdmin updates default settings (userId = null)
            const existing = await prisma.schoolSettings.findFirst({
                where: { userId: null }
            });

            if (existing) {
                await prisma.schoolSettings.update({
                    where: { id: existing.id },
                    data: cleanData
                });
            } else {
                await prisma.schoolSettings.create({
                    data: {
                        ...cleanData,
                        userId: null
                    }
                });
            }
        } else if (userRole === "ADMIN" || userRole === "TEACHER") {
            // Admin/Teacher updates their own settings
            const existing = await prisma.schoolSettings.findUnique({
                where: { userId: userId }
            });

            if (existing) {
                await prisma.schoolSettings.update({
                    where: { id: existing.id },
                    data: cleanData
                });
            } else {
                await prisma.schoolSettings.create({
                    data: {
                        ...cleanData,
                        userId: userId
                    }
                });
            }
        }

        return NextResponse.json({ message: "Settings updated successfully" });
    } catch (error) {
        console.error("Error saving settings:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        return NextResponse.json({
            message: "Error saving settings",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
