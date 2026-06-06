# Quick Memo 📝

Quick Memo is a modern, AI-powered, multi-interface task and note management system designed for extreme productivity. Whether you prefer to stay in your terminal, manage tasks via a beautiful glassmorphism web dashboard, or drop a quick note through a desktop widget, Quick Memo has you covered.

## Features

✨ **Three Seamless Interfaces:**
- **Web Dashboard:** A stunning, responsive Next.js frontend built with a custom Khaki Glassmorphism design system.
- **CLI App:** A lighting-fast, keyboard-driven Node.js command-line interface for power users.
- **Desktop Widget:** An Electron wrapper meant for quick global-hotkey invocations.

🧠 **AI Auto-Categorization:**
- Use the `/ai` prefix in your tasks to automatically analyze your intent. The system leverages OpenAI (GPT-4) to determine the ideal Category, assign a Priority level, and rewrite your task description to be concise and grammatically perfect.

⚡ **Advanced CLI Commands:**
- `/edit <id>`: Modify existing tasks inline.
- `/delete <id1, id2...>`: Bulk delete tasks.
- `/done <id1, id2...>`: Mark tasks as complete.
- `/history`: Toggle between viewing active tasks and completed history.
- **Manual Overrides:** Use `!1`-`!5` to set priority manually, and `#Category` to set the category bypassing the AI.

✍️ **Real-Time Markdown Workspace:**
- A dedicated route (`/markdown`) featuring an elegant, full-width Markdown editor.
- **2-Way Local Sync:** Everything you type is automatically and seamlessly debounced-saved to a local `notes.md` file on your hard drive. File updates made via VSCode or Obsidian instantly hot-reload back into the web UI via intelligent background polling.
- **Email Draft Generation:** One-click button to instantly package your current markdown notes and open them as a ready-to-send draft in your default email client (e.g., Outlook).

## Tech Stack

- **Frontend:** Next.js (React), Plain CSS (Glassmorphism), React-Markdown.
- **Backend:** Next.js API Routes (Serverless).
- **Database:** Vercel Postgres (SQL).
- **CLI/Desktop:** Node.js, Readline, Electron.
- **AI Integration:** OpenAI API.

## Getting Started

### Prerequisites
You will need Node.js installed, along with a Vercel Postgres database and an OpenAI API Key.

### 1. Environment Setup
Create a `.env.local` file inside the `web/` directory with the following variables:
```env
POSTGRES_URL="your_vercel_postgres_connection_string"
OPENAI_API_KEY="your_openai_api_key"
```

### 2. Web Application
Navigate to the web folder, install dependencies, and start the development server:
```bash
cd web
npm install
npm run dev
```
- **Dashboard:** `http://localhost:3000/dashboard`
- **Markdown Editor:** `http://localhost:3000/markdown`

### 3. CLI Application
In a separate terminal, navigate to the CLI folder and run the interactive CLI:
```bash
cd cli
node index.js
```

### 4. Desktop Application
Navigate to the desktop folder and start the Electron app:
```bash
cd desktop
npm install
npm start
```

## Usage Tips
- Try adding a task in the CLI like: `Buy milk for tomorrow !5 #Errands` to manually set priority to 5 and categorize it as Errands.
- Try: `/ai Please remind me to schedule a meeting with the marketing team for next tuesday` and watch the AI instantly clean up your grammar and categorize it as `Work` with the appropriate priority.
