import { NextRequest } from "next/server";
import db from "@/lib/db";
import { detectSearchCapability } from "@/lib/searchDetection";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const { message, history, compactedSummary, memories } = await req.json();

    if (!message) {
        return new Response(JSON.stringify({ error: "Message is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Build persistent memories context
    let memoriesContext = '';
    if (memories) {
        memoriesContext = `(System Note: The following are persistent user memories/preferences. Always keep these in mind when responding.)\n${memories}\n\n`;
    }

    // Build conversation context from compacted summary or history
    let conversationContext = memoriesContext;
    if (compactedSummary) {
        conversationContext += `(System Note: The following is a compacted summary of the earlier conversation. Use it to maintain continuity and understand references to earlier discussions.)\n\n${compactedSummary}\n\n`;
        if (history && Array.isArray(history) && history.length > 0) {
            const contextLines = history.map((msg: { role: string; content: string }) => {
                const role = msg.role === 'user' ? 'User' : 'Assistant';
                const content = msg.role === 'ai' && msg.content.length > 800
                    ? msg.content.substring(0, 800) + '...[truncated]'
                    : msg.content;
                return `${role}: ${content}`;
            });
            conversationContext += `(Recent messages since compaction:)\n\n${contextLines.join('\n\n')}\n\n---\nCurrent message:\n`;
        } else {
            conversationContext += `---\nCurrent message:\n`;
        }
    } else if (history && Array.isArray(history) && history.length > 0) {
        const contextLines = history.map((msg: { role: string; content: string }) => {
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            const content = msg.role === 'ai' && msg.content.length > 800
                ? msg.content.substring(0, 800) + '...[truncated]'
                : msg.content;
            return `${role}: ${content}`;
        });
        conversationContext += `(System Note: Here is the conversation history for context. Use this to understand references like "the data", "that table", etc.)\n\n${contextLines.join('\n\n')}\n\n---\nCurrent message:\n`;
    }

    // Read settings from SQLite
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as {
        apiBaseUrl: string;
        apiKey: string;
        defaultModel: string;
        preferLlmSearch?: number | null;
        allowCodeExecution?: number | null;
    } | undefined;

    // Detect search capability
    const detected = detectSearchCapability(
        settings?.apiBaseUrl || '',
        settings?.defaultModel || ''
    );
    const hasOverride = settings?.preferLlmSearch !== null && settings?.preferLlmSearch !== undefined;
    const effectiveSearch = hasOverride ? settings!.preferLlmSearch === 1 : detected.hasSearch;

    // Build system prompt
    let systemPrompt = "You are a helpful AI assistant.";
    systemPrompt += "\n\n(System Note: If you write or modify any code, scripts, or files to fulfill this request, you MUST output the complete code in a markdown fenced code block in your final response. This is required so the Web UI can display the code in the Canvas panel.)";

    if (effectiveSearch) {
        systemPrompt += `\n\n(System Note: Your LLM provider (${detected.provider}) has built-in web search / grounding capabilities. When you need current information, real-time data, or need to look something up, prefer using your built-in search capability directly instead of the browser tool — it is significantly faster and more reliable.)`;
    }

    systemPrompt += `\n\n(System Note: Whenever you reference news articles, current events, statistics, or factual claims that come from external sources, you MUST cite your sources. Include the publication name and URL where possible. Format citations clearly at the end of your response, e.g. "Source: [Publication Name](URL)". Never present news or factual information without attribution.)`;

    if (settings?.allowCodeExecution) {
        systemPrompt += `\n\n(System Note: CODE EXECUTION IS ENABLED. You can execute Python code on the user's local Windows machine. When you need to perform tasks like file operations, system commands, data processing, or any task that requires running code, wrap your Python code in a fenced code block with the language tag \"python:run\" like this:\n\n\`\`\`python:run\nprint("Hello from the user's machine!")\n\`\`\`\n\nThe code will be automatically executed and you will receive the stdout/stderr output. You can then interpret the results for the user. IMPORTANT: Always explain what the code will do BEFORE the code block. The user's OS is Windows.)`;
    }

    // Build the full user message with conversation context
    const fullUserMessage = conversationContext + message;

    // Build the API URL — ensure it ends with /chat/completions
    let apiBase = settings?.apiBaseUrl || 'http://localhost:11434/v1';
    // Remove trailing slash
    apiBase = apiBase.replace(/\/+$/, '');
    // If it doesn't already end with /chat/completions, add it
    if (!apiBase.endsWith('/chat/completions')) {
        // If it ends with /v1 or similar, add /chat/completions
        apiBase = apiBase + '/chat/completions';
    }

    const apiKey = settings?.apiKey || 'picobot-local';
    const model = settings?.defaultModel || 'llama3';

    // Call the OpenAI-compatible API directly with streaming
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
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: fullUserMessage },
                ],
                stream: true,
            }),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            const encoder = new TextEncoder();
            const errorStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: `⚠️ API Error (${apiResponse.status}): ${errorText}` })}\n\n`));
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                },
            });
            return new Response(errorStream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                },
            });
        }

        // Pipe the API's SSE stream through, extracting content deltas
        const encoder = new TextEncoder();
        const apiReader = apiResponse.body?.getReader();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
            async start(controller) {
                if (!apiReader) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "No response body" })}\n\n`));
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                    return;
                }

                let buffer = '';
                try {
                    while (true) {
                        const { done, value } = await apiReader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith('data: ')) continue;

                            const payload = trimmed.slice(6);
                            if (payload === '[DONE]') {
                                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                                controller.close();
                                return;
                            }

                            try {
                                const parsed = JSON.parse(payload);
                                const delta = parsed.choices?.[0]?.delta?.content;
                                if (delta) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`));
                                }
                            } catch {
                                // Skip malformed JSON chunks
                            }
                        }
                    }
                } catch (err: any) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message || "Stream error" })}\n\n`));
                }

                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (err: any) {
        const encoder = new TextEncoder();
        const errorStream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: `⚠️ Connection error: ${err.message}` })}\n\n`));
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
            },
        });
        return new Response(errorStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    }
}
