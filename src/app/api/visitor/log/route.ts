import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: Request) {
    try {
        const headerList = await headers();
        const ip = headerList.get("x-forwarded-for") || "unknown";
        const userAgent = headerList.get("user-agent") || "unknown";
        const { path } = await req.json();

        await prisma.visitorLog.create({
            data: {
                ip,
                userAgent,
                path: path || "/"
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Visitor logging error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
