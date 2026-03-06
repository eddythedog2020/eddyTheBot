# Build Instructions: EddyTheBot Local Chat UI

> **For AntiGravity** — Step-by-step instructions to build a standalone, local-only web chat application that wraps an existing EddyTheBot binary. No Tauri, no desktop packaging. Everything lives in one folder and runs with `npm run dev`.

---

## Overview

Build a **Next.js** web app that provides a **ChatGPT-style chat interface** backed by a local EddyTheBot binary. The user will supply a folder containing the EddyTheBot executable. The app shells out to it for every message, streaming the response back into the chat UI.

### Key Differences from Eddy Pro (the reference app)

| Feature                     | Eddy Pro                          | This New App                     |
|-----------------------------|-----------------------------------|----------------------------------|
| Desktop packaging           | Tauri .exe                        | **None** — local web server only |
| EddyTheBot binary              | Bundled in `src-tauri/binaries/`  | **Lives in project root** `./bin/` |
| Config storage              | `~/.eddypro/config.json` via IPC  | **`localStorage`** + optional `.env.local` |
| Workspace / Code editor     | Full dual-pane code editor        | **None** — chat only             |
| Website templates           | Yes                               | **None**                         |
| Auth / Login                | Supabase auth                     | **None** — local only            |
| Sidebar                     | Chat history + settings gear      | Chat history sidebar (same style)|
| Settings                    | Full settings page                | Inline settings (API key, model) |

---

## 1. Project Setup

### 1.1 Initialize

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

### 1.2 Install Dependencies

```bash
npm install react-markdown
```

That's it. No Tauri deps, no Supabase, no JSZip, no resizable panels.

### 1.3 Folder Structure

```
project-root/
├── bin/                          # User places their EddyTheBot binary here
│   └── EddyTheBot.exe               # (or EddyTheBot on Linux/Mac)
├── src/
│   ├── app/
│   │   ├── globals.css           # Design system (see §3)
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Main chat page
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts      # API route that shells out to EddyTheBot
│   └── components/
│       └── ChatContext.tsx        # Chat history state + localStorage persistence
├── .env.local                    # Optional: default API key & model
├── package.json
└── next.config.ts
```

### 1.4 Binary Location

The EddyTheBot binary should be placed in `./bin/`. The API route will resolve this path:

```typescript
import path from "path";
const binPath = path.join(process.cwd(), "bin", process.platform === "win32" ? "EddyTheBot.exe" : "EddyTheBot");
```

---

## 2. Design System (globals.css)

The design MUST match the Eddy Pro aesthetic exactly. Use these CSS variables and the **Outfit** font from Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";

:root {
  --bg-primary: #121212;
  --bg-secondary: #1e1e1e;
  --bg-glass: rgba(30, 30, 30, 0.7);
  --text-primary: #f5f5f5;
  --text-secondary: #a3a3a3;
  --accent-color: #404040;
  --accent-hover: #5a5a5a;
  --accent-gradient: linear-gradient(135deg, #404040, #6b6b6b);
  --border-color: rgba(255, 255, 255, 0.1);
  --font-main: 'Outfit', sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-main);
  height: 100vh;
  margin: 0;
  overflow: hidden;
  display: flex;
}
```

### Key UI Classes to Include

Copy these from the reference app's `globals.css`:

- **Scrollbar**: Custom dark scrollbar (`::-webkit-scrollbar` styles)
- **`.glass-panel`**: `background: var(--bg-glass); backdrop-filter: blur(12px); border: 1px solid var(--border-color);`
- **`.chat-container`**: Flex column, centered, scrollable, padding for bottom input
- **`.chat-messages`**: `max-width: 800px`, flex column, `gap: 24px`
- **`.message`** / `.message.user` / `.message.ai`: Avatar + bubble layout
- **`.message-avatar`**: 36px circle, gradient background for AI
- **`.message-bubble`**: 12px radius, `line-height: 1.6`, max-width 80%
- **`.input-wrapper`**: Fixed to bottom, gradient fade background
- **`.input-container`**: Rounded pill (24px radius), dark background, subtle border
- **`.chat-input`**: Transparent background, inherits font, auto-resize textarea
- **`.send-button`**: 40px circle, white background, dark icon
- **`.form-input`**: For settings inputs — dark bg, rounded, subtle border
- **`.btn-primary`**: Gradient button with accent colors

> **CRITICAL**: Use these exact CSS variable names and values. The look and feel must be identical to the reference app — charcoal grey palette, Outfit font, subtle glass effects, no bright accent colors.

---

## 3. Core Components

### 3.1 ChatContext (`src/components/ChatContext.tsx`)

This manages chat sessions with localStorage persistence. Implement exactly as the reference app:

```typescript
type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};
```

**Features:**
- Store all chats in `localStorage` under key `"EddyTheBot-chats"`
- Auto-generate title from first user message (truncate to 25 chars)
- `createChat()`, `addMessageToChat()`, `deleteChat()`
- Move most recently updated chat to top of list
- Default initial AI greeting: `"Hello! I'm EddyTheBot. How can I help you today?"`
- Hydration-safe: don't render children until `useEffect` has set `hasLoaded = true`

### 3.2 Layout (`src/app/layout.tsx`)

Minimal: just wrap `{children}` with `<ChatProvider>`. No auth, no workspace, no site config providers.

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
```

### 3.3 Main Chat Page (`src/app/page.tsx`)

This is the core of the app — a ChatGPT-style layout:

```
┌──────────────────────────────────────────────┐
│ ┌─────────┐  ┌─────────────────────────────┐ │
│ │ SIDEBAR │  │         CHAT AREA           │ │
│ │         │  │                             │ │
│ │ Recent  │  │  [AI Avatar] Hello! I'm...  │ │
│ │ Chats   │  │                             │ │
│ │         │  │  [User Avatar] Can you...   │ │
│ │ + New   │  │                             │ │
│ │         │  │  [AI Avatar] Sure! Here...  │ │
│ │ ──────  │  │                             │ │
│ │ ⚙ Set.  │  │                             │ │
│ └─────────┘  │  ┌───────────────────────┐  │ │
│              │  │ Talk to EddyTheBot...  ➤ │  │ │
│              │  └───────────────────────┘  │ │
│              └─────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Sidebar (left, ~280px):**
- Header: "RECENT CHATS" with a `+` button to create new chat
- List of chat sessions, showing title, sorted by `updatedAt`
- Active chat highlighted with `rgba(255, 255, 255, 0.1)` background
- Click to switch chats
- Bottom: Settings gear icon (toggles inline settings panel)

**Chat Area (right, fills remaining space):**
- Scrollable message list, max-width 800px, centered
- Each message: avatar circle (left for AI, right for user) + bubble
- AI avatar: gradient background with "PB" text
- User avatar: dark background with "You" text
- AI messages rendered with `react-markdown` for formatting
- Bottom: Fixed input bar with textarea + circular send button
- Auto-scroll to bottom on new messages
- Loading state: show "EddyTheBot is thinking..." with a pulsing animation

**Inline Settings Panel (toggled from sidebar gear icon):**
- Slides in from bottom or replaces chat area temporarily
- Fields: API Base URL, API Key (password), Default Model
- Uses `.form-input` and `.btn-primary` classes
- Saves to `localStorage` under key `"EddyTheBot-settings"`
- Settings are sent to the API route with each chat request

### 3.4 Chat API Route (`src/app/api/chat/route.ts`)

This is the backend that executes EddyTheBot. Use the Next.js App Router pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  const { message, settings } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Resolve binary path
  const ext = process.platform === "win32" ? ".exe" : "";
  const binPath = path.join(process.cwd(), "bin", `EddyTheBot${ext}`);

  // Build args — pass model and API config if provided
  const args = ["agent", "-m", message];

  // Set environment variables for the EddyTheBot process
  const env = { ...process.env };
  if (settings?.openaiApiKey) env.OPENAI_API_KEY = settings.openaiApiKey;
  if (settings?.openaiApiBase) env.OPENAI_API_BASE = settings.openaiApiBase;
  if (settings?.model) env.MODEL = settings.model;

  try {
    const { stdout, stderr } = await execFileAsync(binPath, args, {
      env,
      timeout: 120000, // 2 min timeout
    });

    const response = (stdout || stderr).trim();
    return NextResponse.json({ response });
  } catch (e: any) {
    const fallback = e.stdout || e.stderr || e.message || "EddyTheBot error";
    return NextResponse.json({ response: fallback });
  }
}
```

> **Important**: The API route passes settings as environment variables to EddyTheBot. Alternatively, if EddyTheBot reads from `~/.EddyTheBot/config.json`, you can write that file from the settings panel instead. Check how the binary actually consumes its configuration and adjust accordingly.

---

## 4. Chat Page Implementation Details

### 4.1 Sending Messages

```typescript
const sendMessage = async () => {
  if (!input.trim() || isLoading) return;

  const userMsg = { id: Date.now().toString(), role: "user", content: input.trim() };
  addMessageToChat(activeChatId, userMsg);
  setInput("");
  setIsLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input.trim(),
        settings: JSON.parse(localStorage.getItem("EddyTheBot-settings") || "{}"),
      }),
    });

    const data = await res.json();
    const aiMsg = { id: (Date.now() + 1).toString(), role: "ai", content: data.response };
    addMessageToChat(activeChatId, aiMsg);
  } catch (err) {
    const errMsg = { id: (Date.now() + 1).toString(), role: "ai", content: "⚠️ Failed to reach EddyTheBot. Is the binary in `./bin/`?" };
    addMessageToChat(activeChatId, errMsg);
  } finally {
    setIsLoading(false);
  }
};
```

### 4.2 Input Handling

- Textarea with auto-resize (up to 200px max height)
- **Enter** sends, **Shift+Enter** adds newline
- Disabled while loading
- Placeholder: `"Talk to EddyTheBot..."`

### 4.3 Message Rendering

```tsx
<div className={`message ${msg.role === "user" ? "user" : "ai"}`}>
  <div className="message-avatar">
    {msg.role === "ai" ? "PB" : "You"}
  </div>
  <div className="message-bubble">
    {msg.role === "ai" ? (
      <ReactMarkdown className="prose">{msg.content}</ReactMarkdown>
    ) : (
      msg.content
    )}
  </div>
</div>
```

---

## 5. Settings Storage

Store settings in `localStorage` under key `"EddyTheBot-settings"`:

```json
{
  "openaiApiKey": "sk-or-v1-...",
  "openaiApiBase": "https://openrouter.ai/api/v1",
  "model": "google/gemini-2.5-flash"
}
```

These are read on every chat request and sent to the API route, which passes them as environment variables to the EddyTheBot process.

---

## 6. Running the App

```bash
# 1. Place EddyTheBot binary
cp /path/to/EddyTheBot.exe ./bin/EddyTheBot.exe

# 2. Install deps
npm install

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
```

---

## 7. Design Checklist

Before considering the app "done", verify these visual requirements:

- [ ] **Font**: Outfit (loaded from Google Fonts), matches across all text
- [ ] **Background**: `#121212` primary, `#1e1e1e` secondary (sidebar, input bar)
- [ ] **Text colors**: `#f5f5f5` primary, `#a3a3a3` secondary
- [ ] **Chat input**: Pill-shaped (24px radius), dark background, subtle 0.05 opacity border, box shadow
- [ ] **Send button**: Circular (40px), white background, dark arrow icon, scale on hover
- [ ] **Messages**: AI messages left-aligned, user messages right-aligned
- [ ] **AI avatar**: Gradient background (`#404040 → #6b6b6b`), white "PB" text
- [ ] **Sidebar**: Dark, subtle right border, chat list with hover states
- [ ] **Scrollbar**: Custom dark scrollbar, rounded thumb
- [ ] **Animations**: `fadeIn` animation on new messages (opacity + translateY)
- [ ] **Markdown**: AI responses render markdown (code blocks, lists, bold, etc.)
- [ ] **Responsive**: Works well at various browser window sizes
- [ ] **No bright colors**: The palette is entirely charcoal/grey — no blues, greens, or accent colors

---

## 8. What NOT to Include

Do **NOT** implement any of these (they exist in Eddy Pro but not in this app):

- ❌ Tauri / desktop packaging
- ❌ Code editor / workspace panel
- ❌ Website templates or template modal
- ❌ File preview iframe
- ❌ Supabase auth / login screen
- ❌ Whitelabel domain settings
- ❌ Netlify deployment
- ❌ Site config context
- ❌ Resizable panels
- ❌ Download / export functionality
- ❌ Deploy targets (nodejs/netlify/static)
- ❌ Hidden templates (package.json, server.js, etc.)

This is a **pure chat application**. One sidebar, one chat area, one settings panel. That's it.

---

## 9. Reference Files

For design and implementation reference, study these files from the Eddy Pro project:

| File | What to reference |
|------|-------------------|
| `src/app/globals.css` | **Copy the entire design system** — CSS variables, scrollbar, glass-panel, chat classes, input styles, message styles, animations |
| `src/components/ChatContext.tsx` | **Copy the chat state management pattern** — localStorage persistence, session management, auto-titling |
| `src/pages/api/chat.ts` | **Reference the EddyTheBot integration** — how to shell out to the binary and parse responses |
| `src/app/page.tsx` | **Reference the chat UI** — message rendering, input handling, auto-scroll, loading states (ignore workspace/code editor parts) |
| `src/app/settings/page.tsx` | **Reference the settings form styling** — form inputs using CSS variables, section headings, save button |
