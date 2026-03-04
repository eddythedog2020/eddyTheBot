import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET() {
    try {
        const memoryDir = path.join(os.homedir(), ".picobot", "workspace", "memory");

        if (!fs.existsSync(memoryDir)) {
            return NextResponse.json({ files: [] });
        }

        const entries = fs.readdirSync(memoryDir);
        const files: { name: string; content: string; type: "soul" | "daily" }[] = [];

        for (const entry of entries) {
            const fullPath = path.join(memoryDir, entry);
            const stat = fs.statSync(fullPath);
            if (!stat.isFile() || !entry.endsWith(".md")) continue;

            const content = fs.readFileSync(fullPath, "utf-8");
            const isDailyLog = /^\d{4}-\d{2}-\d{2}\.md$/.test(entry);

            files.push({
                name: entry,
                content,
                type: isDailyLog ? "daily" : "soul",
            });
        }

        // Sort daily logs newest first
        files.sort((a, b) => {
            if (a.type !== b.type) return a.type === "soul" ? -1 : 1;
            return b.name.localeCompare(a.name);
        });

        return NextResponse.json({ files });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
