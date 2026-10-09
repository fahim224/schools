import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeUser } from "@/lib/sanitize-user";

// Force reload comment
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: { schoolSettings: { select: { isIdCardEnabled: true } } }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(sanitizeUser(user));
    } catch (error) {
        console.error("Fetch User Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { role, isActive, receivedAmount, phone, classLimit, isIdCardEnabled } = body;

        const dataUpdate: any = {
            role,
            isActive: isActive ?? true,
            receivedAmount: parseFloat(receivedAmount || 0),
            phone: phone || null,
            classLimit: classLimit !== undefined ? parseInt(classLimit) : undefined,
        };

        if (role === "ADMIN" && isIdCardEnabled !== undefined) {
            dataUpdate.schoolSettings = {
                upsert: {
                    create: {
                        schoolName: "لیسه عالی خصوصی",
                        isIdCardEnabled
                    },
                    update: {
                        isIdCardEnabled
                    }
                }
            };
        }

        const user = await prisma.user.update({
            where: { id },
            data: dataUpdate,
        });

        return NextResponse.json({ message: "User updated successfully", user: sanitizeUser(user) });
    } catch (error) {
        console.error("Update User Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
