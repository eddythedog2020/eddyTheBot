# PicoBot Chat 🤖

A private, local-first agentic chat interface designed to run alongside the PicoBot ecosystem. PicoBot Chat serves as your command center for automation, personal memory, and workflow management.

## 🚀 Key Features

- **Agentic Utilities**:
  - 🧠 **Memory Viewer**: Navigate your agent's daily logs and long-term "soul" memory files in a clean timeline view.
  - 📋 **Tasks & Reminders**: A persistent local task system for managing reminders and to-do lists that survive restarts.
  - 📝 **Quick Notes**: A monospace scratchpad for jotting down code snippets or ideas with debounced auto-save.
- **Voice-Enabled**: Real-time speech-to-text transcription using the Web Speech API.
- **Smart Suggestions**: A rotating pool of 20+ tailored use cases—from website monitoring and whale tracking to professional drafting and brainstorming.
- **Local-First History**: Full conversation persistence using a local SQLite database (`picobot.db`).
- **PicoBot Integration**: Designed to interact with the PicoBot binary for executing heavy-duty agentic tasks.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS.
- **Persistence**: 
  - **SQLite**: Stores chat history, metadata, and settings.
  - **Markdown**: Stores agentic data (Memory, Tasks, Notes) for human/agent readability.
- **Transcription**: Browser-native Web Speech API.

## 🏁 Getting Started

### Prerequisites

- **Next.js**: Node.js 18.x or later.
- **PicoBot Binary**: Ensure you have the `picobot` binary in the `bin/` directory for your platform.
  - Windows: `bin/picobot.exe`
  - Linux: `bin/picobot`

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3001](http://localhost:3001) in your browser.

## ⚖️ License

This project is private and intended for local use. 
