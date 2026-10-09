import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // ENTRY or EXIT
        const role = searchParams.get("role");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: any = {
            createdById: (session.user as any).id // Filter by school
        };

        if (type && type !== "ALL") {
            where.type = type;
        }

        if (role && role !== "ALL") {
            where.user = { role: role };
        }

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.timestamp.lte = end;
            }
        }

        const logs = await prisma.gateLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        role: true,
                        studentId: true,
                        image: true,
                        fatherName: true,
                        grandfatherName: true,
                        phone: true,
                        email: true,
                        currentClass: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                recordedBy: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                timestamp: "desc"
            }
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Gate Logs Fetch Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
