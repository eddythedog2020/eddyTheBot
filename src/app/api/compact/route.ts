import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { validateAuth } from "@/lib/authMiddleware";

export async function POST(req: NextRequest) {
    const authError = validateAuth(req);
    if (authError) return authError;

    const { messages, customPrompt } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    // Read settings from SQLite
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as {
        apiBaseUrl: string;
        apiKey: string;
        defaultModel: string;
    } | undefined;

    // Build conversation text for summarization
    const conversationText = messages.map((msg: { role: string; content: string }) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
    }).join('\n\n');

    // Build the compaction prompt
    let compactPrompt = `You are a conversation summarizer. Your task is to create a concise but comprehensive summary of the following conversation. 

IMPORTANT RULES:
- Preserve ALL key facts, data, decisions, and context
- Include any specific values, numbers, names, code snippets, or table data that were discussed
- Note any ongoing tasks, preferences, or instructions the user has given
- Keep the summary structured and scannable
- The summary should be detailed enough that a new AI assistant could continue the conversation seamlessly
- Do NOT include any meta-commentary like "Here is the summary" — just output the summary directly`;

    if (customPrompt) {
        compactPrompt += `\n\nAdditional instruction from user: ${customPrompt}`;
    }

    compactPrompt += `\n\n--- CONVERSATION TO SUMMARIZE ---\n\n${conversationText}\n\n--- END OF CONVERSATION ---\n\nProvide the summary now:`;

    // Build the API URL
    let apiBase = settings?.apiBaseUrl || 'http://localhost:11434/v1';
    apiBase = apiBase.replace(/\/+$/, '');
    if (!apiBase.endsWith('/chat/completions')) {
        apiBase = apiBase + '/chat/completions';
    }

    const apiKey = settings?.apiKey || 'picobot-local';
    const model = settings?.defaultModel || 'llama3';

    try {
        const apiResponse = await fetch(apiBase, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'user', content: compactPrompt },
                ],
                stream: false,
            }),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            return NextResponse.json({ summary: `Compaction failed: ${errorText}` });
        }

        const data = await apiResponse.json();
        const summary = data.choices?.[0]?.message?.content || 'Compaction produced no output';
        return NextResponse.json({ summary });
    } catch (e: any) {
        return NextResponse.json({ summary: `Compaction failed: ${e.message}` });
    }
}
