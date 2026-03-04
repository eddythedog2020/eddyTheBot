import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const SOUL_PATH = path.join(os.homedir(), ".picobot", "workspace", "SOUL.md");
const DEFAULT_NAME = "Eddy";

function extractBotName(): string {
    try {
        const content = fs.readFileSync(SOUL_PATH, "utf-8");
        // Look for "I am <Name>" pattern in the SOUL.md file
        const match = content.match(/I am (\w+)/i);
        if (match && match[1]) {
            return match[1];
        }
        return DEFAULT_NAME;
    } catch {
        return DEFAULT_NAME;
    }
}

export async function GET() {
    return NextResponse.json({ name: extractBotName() });
}
