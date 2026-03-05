import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const NOTES_PATH = path.join(os.homedir(), ".picobot", "workspace", "NOTES.md");

export async function GET() {
    try {
        if (!fs.existsSync(NOTES_PATH)) {
            return NextResponse.json({ content: "" });
        }
        const content = fs.readFileSync(NOTES_PATH, "utf-8");
        return NextResponse.json({ content });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { content } = body;
        if (content === undefined) {
            return NextResponse.json({ error: "content is required" }, { status: 400 });
        }

        const dir = path.dirname(NOTES_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(NOTES_PATH, content, "utf-8");
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
