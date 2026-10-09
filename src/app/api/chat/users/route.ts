import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
            include: { schoolSettings: true }
        });

        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        const role = user.role;
        const userId = user.id;

        let conditions: any[] = [];

        // 1. SUPERADMIN
        if (role === "SUPERADMIN") {
            // Can chat with:
            // - ADMIN (School Principals)
            // - TEACHER (who have no manager/createdById)
            conditions.push({ role: "ADMIN" });
            conditions.push({ role: "TEACHER", createdById: null });
        }

        // 2. ADMIN (School Principal)
        else if (role === "ADMIN") {
            // Can chat with:
            // - SUPERADMIN
            // - TEACHER (created by this admin)
            // - PARENT (created by this admin)
            conditions.push({ role: "SUPERADMIN" });
            conditions.push({ role: "TEACHER", createdById: userId });
            conditions.push({ role: "PARENT", createdById: userId });
        }

        // 3. TEACHER
        else if (role === "TEACHER") {
            // Can chat with:
            // - My Manager (Admin)
            // - SuperAdmin (ONLY if no manager)
            // - Parents of my students

            const managerId = user.createdById;

            if (managerId) {
                conditions.push({ id: managerId });
            } else {
                conditions.push({ role: "SUPERADMIN" });
            }

            // Find Parents of students in my classes
            const classesAsTeacher = await prisma.schoolClass.findMany({
                where: { teacherId: userId },
                include: {
                    students: {
                        include: {
                            parents: true
                        }
                    }
                }
            });

            const parentIds = new Set<string>();
            classesAsTeacher.forEach(cls => {
                cls.students.forEach(student => {
                    student.parents.forEach(parent => {
                        parentIds.add(parent.id);
                    });
                });
            });

            if (parentIds.size > 0) {
                conditions.push({ id: { in: Array.from(parentIds) } });
            }
        }

        // 4. PARENT
        else if (role === "PARENT") {
            // Can chat with:
            // - Admin (Creator)
            // - Teachers of their children

            const adminId = user.createdById;
            if (adminId) {
                conditions.push({ id: adminId });
            }

            // Teachers of children
            const children = await prisma.user.findMany({
                where: { parents: { some: { id: userId } } },
                include: {
                    currentClass: {
                        select: { teacherId: true }
                    }
                }
            });

            const teacherIds = new Set<string>();
            children.forEach(child => {
                if (child.currentClass?.teacherId) {
                    teacherIds.add(child.currentClass.teacherId);
                }
            });

            if (teacherIds.size > 0) {
                conditions.push({ id: { in: Array.from(teacherIds) } });
            }
        }

        const potentialChatUsers = await prisma.user.findMany({
            where: {
                OR: conditions,
                isActive: true,
                NOT: { id: userId } // Exclude self
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                lastActiveAt: true,
                lastTypedAt: true,
                schoolSettings: {
                    select: { schoolName: true }
                },
                sentChats: {
                    where: {
                        receiverId: userId,
                        read: false
                    },
                    select: { id: true }
                },
                blockedBy: {
                    where: { id: userId },
                    select: { id: true }
                },
                blockedUsers: {
                    where: { id: userId },
                    select: { id: true }
                }
            }
        });

        // Calculate "Online" status
        // Assume online if active in last 2 minutes
        const now = new Date();
        const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
        const fiveSecondsAgo = new Date(now.getTime() - 5 * 1000); // 5 seconds for typing indicator

        // Get latest messages to sort the list
        const latestChats = await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            select: {
                senderId: true,
                receiverId: true,
                createdAt: true
            }
        });

        // Create a map of otherUserId -> latestChatTime
        const chatTimes = new Map<string, Date>();
        latestChats.forEach(chat => {
            const otherId = chat.senderId === userId ? chat.receiverId : chat.senderId;
            if (!chatTimes.has(otherId)) {
                chatTimes.set(otherId, chat.createdAt);
            }
        });

        const usersWithStatus = potentialChatUsers.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            image: u.image,
            lastActiveAt: u.lastActiveAt,
            isOnline: u.lastActiveAt ? new Date(u.lastActiveAt) > twoMinutesAgo : false,
            isTyping: u.lastTypedAt ? new Date(u.lastTypedAt) > fiveSecondsAgo : false,
            unreadCount: u.sentChats.length,
            schoolSettings: u.schoolSettings,
            isBlockedByMe: u.blockedBy.some((b: any) => b.id === userId),
            amIBlocked: u.blockedUsers.some((b: any) => b.id === userId),
            lastMessageAt: chatTimes.get(u.id) || null
        }));

        // Sort by lastMessageAt desc, then by isOnline
        usersWithStatus.sort((a: any, b: any) => {
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            if (timeB !== timeA) return timeB - timeA;
            if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
            return (a.name || "").localeCompare(b.name || "");
        });

        return NextResponse.json(usersWithStatus);

    } catch (error) {
        console.error("Chat Users Error:", error);
        return NextResponse.json({ message: "Error fetching chat users" }, { status: 500 });
    }
}
