import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const contactId = searchParams.get("userId");

        if (!contactId) return NextResponse.json({ message: "User ID required" }, { status: 400 });

        const userId = (session.user as any).id;

        // Fetch messages between these two users
        const messages = await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: contactId },
                    { senderId: contactId, receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                sender: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        // Mark messages as read (if I am the receiver)
        await prisma.chatMessage.updateMany({
            where: {
                senderId: contactId,
                receiverId: userId,
                read: false
            },
            data: {
                read: true
            }
        });

        return NextResponse.json(messages);

    } catch (error) {
        console.error("Chat History Error:", error);
        return NextResponse.json({ message: "Error fetching messages" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { receiverId, content } = body;

        if (!receiverId || !content) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        const senderId = (session.user as any).id;
        const senderRole = (session.user as any).role;

        // Global Chat check (SuperAdmin setting)
        const globalSettings = await prisma.schoolSettings.findFirst({
            where: { userId: null }
        });
        if (globalSettings && !globalSettings.isChatEnabled && senderRole !== "SUPERADMIN") {
            return NextResponse.json({ message: "Chat is temporarily disabled by SuperAdmin" }, { status: 403 });
        }

        // Check if sender is blocked by receiver
        const isBlocked = await prisma.user.findFirst({
            where: {
                id: receiverId,
                blockedUsers: {
                    some: { id: senderId }
                }
            }
        });

        if (isBlocked) {
            return NextResponse.json({ message: "You are blocked by this user" }, { status: 403 });
        }

        const message = await prisma.chatMessage.create({
            data: {
                content,
                senderId,
                receiverId
            },
            include: {
                sender: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        return NextResponse.json(message);

    } catch (error) {
        console.error("Send Message Error:", error);
        return NextResponse.json({ message: "Error sending message" }, { status: 500 });
    }
}
