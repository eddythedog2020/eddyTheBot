import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const WORKSPACE = path.join(os.homedir(), ".picobot", "workspace");

export async function GET(req: NextRequest) {
    const filePath = req.nextUrl.searchParams.get("path");
    if (!filePath) {
        return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
    }

    const fullPath = path.join(WORKSPACE, filePath);

    // Security: ensure the resolved path is within the workspace
    if (!fullPath.startsWith(WORKSPACE)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    try {
        const stats = fs.statSync(fullPath);
        if (stats.size > 500_000) {
            return NextResponse.json({ error: "File too large to preview" }, { status: 413 });
        }

        const content = fs.readFileSync(fullPath, "utf-8");
        const ext = path.extname(fullPath).replace(".", "").toLowerCase();

        return NextResponse.json({ content, extension: ext, name: path.basename(fullPath), size: stats.size });
    } catch {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
