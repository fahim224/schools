
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;

    try {
        // Fetch valid messages for this role
        // Since we can't do complex string array contains easily in Sqlite/Prisma without native support or many-many,
        // we used string "ALL" or "TEACHER,ADMIN".
        // We will fetch all visible messages and filter in code or use "contains".

        // Simple filter: 
        let senderCondition: any = {};
        if (role === 'TEACHER' || role === 'STUDENT' || role === 'PARENT') {
            // Fetch user's creator to filter messages from their specific admin
            const user = await prisma.user.findUnique({ where: { id: (session.user as any).id }, select: { createdById: true } });
            const creatorId = user?.createdById;

            // Allow messages from SUPERADMIN or their direct Creator (Admin)
            senderCondition = {
                OR: [
                    { sender: { role: 'SUPERADMIN' } },
                    ...(creatorId ? [{ senderId: creatorId }] : [])
                ]
            };
        }

        const messages = await prisma.message.findMany({
            where: {
                isVisible: true,
                ...senderCondition,
                OR: [
                    { targetRoles: "ALL" },
                    { targetRoles: { contains: role } }
                ]
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                sender: {
                    select: { name: true, role: true, image: true }
                }
            }
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Messages Fetch Error:", error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { content, targetRoles, isAnonymous } = body;

    // Allow anonymous messages ONLY if they are from the landing page and target SUPERADMIN
    if (isAnonymous && targetRoles === "SUPERADMIN") {
        try {
            const superAdmin = await prisma.user.findFirst({
                where: { role: "SUPERADMIN" }
            });

            if (!superAdmin) {
                return NextResponse.json({ message: "No SuperAdmin found" }, { status: 500 });
            }

            const message = await prisma.message.create({
                data: {
                    content,
                    targetRoles: "SUPERADMIN",
                    senderId: superAdmin.id,
                    isVisible: true
                }
            });

            return NextResponse.json(message, { status: 201 });
        } catch (error) {
            console.error("Anonymous Message Error:", error);
            return NextResponse.json({ message: "Error sending anonymous message" }, { status: 500 });
        }
    }

    if (!session || ((session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "ADMIN")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        if (!content || !targetRoles) {
            return NextResponse.json({ message: "Content and target roles are required" }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                content,
                targetRoles,
                senderId: (session.user as any).id,
                isVisible: true
            }
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Message Creation Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
