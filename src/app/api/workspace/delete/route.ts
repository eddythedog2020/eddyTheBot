import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const WORKSPACE = path.join(os.homedir(), ".picobot", "workspace");

export async function DELETE(req: NextRequest) {
    const folderPath = req.nextUrl.searchParams.get("path");
    if (!folderPath) {
        return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
    }

    const fullPath = path.join(WORKSPACE, folderPath);

    // Security: ensure the resolved path is within the workspace
    if (!fullPath.startsWith(WORKSPACE)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only allow deleting project folders
    if (!path.basename(fullPath).startsWith("project-")) {
        return NextResponse.json({ error: "Can only delete project folders" }, { status: 403 });
    }

    try {
        if (!fs.existsSync(fullPath)) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        fs.rmSync(fullPath, { recursive: true, force: true });
        return NextResponse.json({ success: true, deleted: folderPath });
    } catch (e) {
        return NextResponse.json({ error: `Failed to delete: ${e}` }, { status: 500 });
    }
}
