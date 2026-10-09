import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import { basename, extname, resolve, sep } from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN" && (session.user as any).role !== "TEACHER")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        const extension = extname(file.name).toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
            return NextResponse.json({ message: "Only JPG, PNG, WebP, GIF and AVIF images are allowed" }, { status: 415 });
        }

        if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ message: "Image must be smaller than 8 MB" }, { status: 413 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `${Date.now()}-${randomUUID()}${extension}`;
        const uploadsDirectory = resolve(process.cwd(), "public", "uploads");
        const path = resolve(uploadsDirectory, filename);

        if (!path.startsWith(`${uploadsDirectory}${sep}`)) {
            return NextResponse.json({ message: "Invalid file path" }, { status: 400 });
        }

        await mkdir(uploadsDirectory, { recursive: true });
        await writeFile(path, buffer);

        return NextResponse.json({
            message: "File uploaded successfully",
            url: `/uploads/${filename}`
        }, { status: 201 });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const fileUrl = searchParams.get("url");

        if (!fileUrl) {
            return NextResponse.json({ message: "No file URL provided" }, { status: 400 });
        }

        // Security check: only allow deleting files from /uploads/
        if (!fileUrl.startsWith("/uploads/")) {
            return NextResponse.json({ message: "Invalid file path" }, { status: 400 });
        }

        const filename = basename(fileUrl);
        if (`/uploads/${filename}` !== fileUrl) {
            return NextResponse.json({ message: "Invalid file path" }, { status: 400 });
        }

        const uploadsDirectory = resolve(process.cwd(), "public", "uploads");
        const path = resolve(uploadsDirectory, filename);
        if (!path.startsWith(`${uploadsDirectory}${sep}`)) {
            return NextResponse.json({ message: "Invalid file path" }, { status: 400 });
        }

        if (existsSync(path)) {
            await unlink(path);
            return NextResponse.json({ message: "File deleted successfully" });
        } else {
            return NextResponse.json({ message: "File not found" }, { status: 404 });
        }

    } catch (error) {
        console.error("Delete File Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
