import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const MIME_TYPES: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    txt: "text/plain; charset=utf-8",
    csv: "text/csv; charset=utf-8",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;

        if (!filename || filename.includes("/") || filename.includes("\\")) {
            return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
        }

        const safeName = path.basename(filename);
        const filePath = path.join(process.cwd(), "public", "uploads", safeName);
        const fileBuffer = await readFile(filePath);

        const extension = safeName.split(".").pop()?.toLowerCase() || "";
        const contentType = MIME_TYPES[extension] || "application/octet-stream";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${encodeURIComponent(safeName)}"`,
                "Cache-Control": "private, max-age=0, must-revalidate",
            },
        });
    } catch {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
