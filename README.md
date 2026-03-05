# 🤖 EddyTheBot

**A private, local-first agentic chat interface — your personal AI command center for automation, code execution, memory, and multi-platform messaging.**

> Think of it as your own ChatGPT desktop app, but local, private, extensible, and packed with agentic superpowers.

---

## ✨ Features

### 🧠 Core Chat
- **Multi-LLM Support** — Works with any OpenAI-compatible API: Google Gemini, OpenAI, Anthropic, Perplexity, local models (Ollama), and more.
- **Streaming Responses** — Real-time output with markdown rendering, syntax highlighting, and code blocks.
- **Chat History** — Full conversation persistence with rename, delete, and search. Survives restarts.
- **Onboarding Wizard** — Guided 4-step setup for first-time users — pick your LLM provider, enter your API key, and you're chatting in under 60 seconds.
- **Voice Input** — Real-time speech-to-text using the Web Speech API.
- **Vision / Image Analysis** — Upload or paste images for multimodal analysis.

### ⚡ Code Execution
- **Python Execution Engine** — Execute Python code directly on the host machine from the chat.
- **Auto-detect & Run** — Code blocks tagged `python:run` are automatically executed with output displayed inline.
- **Follow-up Interpretation** — After execution, the LLM interprets the results and explains them.
- **Cross-platform** — Uses `python` on Windows, `python3` on Linux/macOS automatically.
- **Safe Defaults** — Disabled by default — opt-in via Settings with a safety warning.

### 🚀 Netlify Deployment
- **One-prompt deploys** — Tell the bot to create a website and deploy it to Netlify — it handles everything.
- **Unique sites per deploy** — Each deploy creates a brand-new Netlify site with a unique URL.

### 🔧 Skill System
- **Auto-discovery** — Skills are automatically detected and injected into the LLM system prompt.
- **SKILL.md Format** — Each skill is a folder with a `SKILL.md` file containing instructions.
- **Skill Builder** — A meta-skill for creating new skills.
- **Included Skills** — `netlify-deploy`, `weather`, `cron`, `site-monitor`, `whale-monitor`, `skill-builder`.

### 📦 Agentic Utilities
- 🧠 **Memory Viewer** — Navigate daily agent logs and long-term memory files.
- 📋 **Tasks & Reminders** — Persistent local task system with reminders that survive restarts.
- 📝 **Quick Notes** — Monospace scratchpad with debounced auto-save.
- 📁 **Workspace File Manager** — Browse, view, and manage workspace files from the UI.

### 🔌 Integrations
- **Telegram Bot** — Connect your own Telegram bot for mobile messaging.
- **Discord Bot** — Connect a Discord bot for server-based messaging.
- **Canvas Panel** — Code output displayed in a side panel for easy viewing and copying.

---

## 🖥️ Screenshots

*Coming soon — screenshots of the onboarding wizard, chat interface, code execution, and settings panel.*

---

## 🏁 Quick Start

### Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js** | v18 or later ([download](https://nodejs.org/)) |
| **Python 3** | Required only for code execution feature |
| **LLM API Key** | From Google Gemini, OpenAI, Anthropic, or any OpenAI-compatible provider |

### 1. Clone the repo

```bash
git clone https://github.com/eddythedog2020/eddyTheBot.git
cd eddyTheBot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Download the PicoBot binary

Download the binary for your platform from the [**Releases page**](https://github.com/eddythedog2020/eddyTheBot/releases) and place it in the `bin/` directory:

| Platform | Binary | Destination |
|---|---|---|
| Windows | `picobot-windows-amd64.exe` | `bin/picobot.exe` |
| macOS (Intel) | `picobot-darwin-amd64` | `bin/picobot` |
| macOS (Apple Silicon) | `picobot-darwin-arm64` | `bin/picobot` |
| Linux | `picobot-linux-amd64` | `bin/picobot` |

```bash
# Create the bin directory
mkdir -p bin

# macOS/Linux: make the binary executable
chmod +x bin/picobot
```

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the onboarding wizard will guide you through setup.

---

## 📱 Platform-Specific Install Guides

### 🪟 Windows

```powershell
# 1. Install Node.js from https://nodejs.org/ (LTS recommended)
# 2. Clone and install
git clone https://github.com/eddythedog2020/eddyTheBot.git
cd eddyTheBot
npm install

# 3. Download picobot-windows-amd64.exe from Releases
# 4. Place it as bin\picobot.exe
mkdir bin
# Move the downloaded file to bin\picobot.exe

# 5. Start
npm run dev
```

### 🍎 macOS

```bash
# 1. Install Node.js
brew install node
# Or download from https://nodejs.org/

# 2. Clone and install
git clone https://github.com/eddythedog2020/eddyTheBot.git
cd eddyTheBot
npm install

# 3. Download the right binary from Releases:
#    - Apple Silicon (M1/M2/M3/M4): picobot-darwin-arm64
#    - Intel Mac: picobot-darwin-amd64
mkdir -p bin
# Move the downloaded binary to bin/picobot
chmod +x bin/picobot

# 4. Start
npm run dev
```

### 🐧 Linux

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# 2. Clone and install
git clone https://github.com/eddythedog2020/eddyTheBot.git
cd eddyTheBot
npm install

# 3. Download picobot-linux-amd64 from Releases
mkdir -p bin
# Move the downloaded binary to bin/picobot
chmod +x bin/picobot

# 4. Start
npm run dev
```

---

## ☁️ Server Deployment (Ubuntu/VPS)

For running EddyTheBot on a cloud server (DigitalOcean, Hetzner, etc.):

```bash
# 1. Install dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs python3 make g++ gcc nginx

# 2. Add swap if < 2GB RAM
fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile

# 3. Clone and build
git clone https://github.com/eddythedog2020/eddyTheBot.git /opt/eddythebot
cd /opt/eddythebot
npm ci && npm run build

# 4. Set up PicoBot binary
mkdir -p bin
# Download picobot-linux-amd64 from Releases to bin/picobot
chmod +x bin/picobot

# 5. Install PM2 and start
npm install -g pm2
PORT=3000 pm2 start npm --name eddythebot -- start
pm2 save && pm2 startup

# 6. Configure nginx reverse proxy
cat > /etc/nginx/sites-available/eddythebot << 'EOF'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/eddythebot /etc/nginx/sites-enabled/eddythebot
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

---

## 🐳 Docker

```bash
# Quick start
docker compose up -d

# Manual build
docker build -t eddythebot .
docker run -d -p 3000:3000 -v eddythebot-data:/app/data --name eddythebot eddythebot

# Stop
docker compose down        # data preserved
docker compose down -v     # delete data volume
```

---

## ⚙️ Configuration

All settings are managed via the **Settings** page in the UI (gear icon ⚙️), or through the onboarding wizard on first launch.

| Setting | Description |
|---|---|
| **API Base URL** | Your LLM provider endpoint (OpenAI-compatible) |
| **API Key** | Authentication key for the LLM API |
| **Default Model** | Model to use (e.g., `gemini-2.0-flash`, `gpt-4o-mini`) |
| **Bot Name** | Display name for the assistant |
| **Code Execution** | Enable/disable Python execution (off by default) |
| **Telegram Token** | Connect to a Telegram bot |
| **Discord Token** | Connect to a Discord bot |

### Supported LLM Providers

| Provider | API Base URL | Example Model |
|---|---|---|
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.0-flash` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Anthropic | `https://api.anthropic.com/v1` | `claude-sonnet-4-20250514` |
| Ollama (local) | `http://localhost:11434/v1` | `llama3` |
| Any OpenAI-compatible | Your endpoint URL | Your model name |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Backend | Next.js API Routes, SQLite (via `better-sqlite3`) |
| Persistence | SQLite for chats/settings; Markdown for memory/tasks/notes |
| Code Execution | Python subprocess with UTF-8 encoding and 120s timeout |
| Bot Engine | PicoBot — lightweight Go binary for agentic tasks |
| Process Manager | PM2 (for server deployments) |
| Reverse Proxy | nginx (for server deployments) |

---

## 📂 Project Structure

```
eddyTheBot/
├── src/
│   ├── app/              # Next.js pages and API routes
│   │   ├── page.tsx      # Main chat interface
│   │   ├── onboarding/   # 4-step setup wizard
│   │   └── api/          # Backend API routes
│   ├── components/       # React components
│   └── lib/              # Utilities and database
├── bin/                  # PicoBot binary (per-platform, gitignored)
├── data/                 # SQLite database (auto-created, gitignored)
├── public/               # Static assets
├── Dockerfile            # Container build
├── docker-compose.yml    # Docker Compose config
└── package.json          # Dependencies
```

---

## 🤝 Contributing

This is a personal project, but pull requests and issues are welcome!

## ⚖️ License

MIT — see [LICENSE](LICENSE) for details.
