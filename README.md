# OllamaChatAPI

A full-stack chat application that lets you talk to a locally running LLM using **[Ollama](https://ollama.com/)**.  
The **Spring Boot** backend exposes a streaming REST API powered by **Spring AI**, and the **React + TypeScript** frontend delivers a real-time chat UI with conversation memory — all running entirely on your machine, no cloud required.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend Language | Java | 17+ |
| Backend Framework | Spring Boot | 3.5.0 |
| AI Integration | Spring AI | 1.1.3 |
| LLM Runtime | Ollama (local) | latest |
| Default Model | Mistral 7B | latest |
| API Documentation | springdoc-openapi (Swagger UI) | 2.8.6 |
| Backend Build | Maven Wrapper | included |
| Frontend Language | TypeScript | 5.6 |
| Frontend Framework | React | 18.3 |
| Frontend Build Tool | Vite | 8+ |
| Node.js Manager | nodeenv (Python) | latest |
| Icons | lucide-react | 0.4+ |

---

## Project Structure

```
OllamaChatAPI/
│
├── src/                                   # Spring Boot backend
│   └── main/
│       ├── java/com/springai/springaicode/
│       │   ├── SpringAiCodeApplication.java   # Entry point
│       │   ├── OllamaController.java          # REST + SSE endpoints
│       │   ├── OllamaClientConfig.java        # WebClient timeout config
│       │   └── OpenApiConfig.java             # Swagger / OpenAPI configuration
│       └── resources/
│           └── application.properties         # Ollama & Spring settings
│
├── frontend/                              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatMessage.tsx            # Individual message bubble
│   │   │   ├── ChatMessage.module.css
│   │   │   ├── ChatInput.tsx              # Textarea + Send / Stop button
│   │   │   └── ChatInput.module.css
│   │   ├── hooks/
│   │   │   └── useChat.ts                 # All chat logic + SSE streaming
│   │   ├── App.tsx                        # Root component + header
│   │   ├── App.css
│   │   ├── types.ts                       # Message type definitions
│   │   ├── main.tsx                       # React entry point
│   │   └── vite-env.d.ts                  # Typed VITE_* env declarations
│   ├── .env                               # Shared defaults (committed)
│   ├── .env.development                   # Dev overrides — Vite proxy (committed)
│   ├── .env.production                    # Prod overrides — direct URL (committed)
│   ├── vite.config.ts                     # Vite + proxy config (reads env)
│   ├── tsconfig.json                      # Browser TypeScript config
│   ├── tsconfig.node.json                 # Node / Vite TypeScript config
│   └── package.json
│
├── .gitignore
├── pom.xml
└── README.md
```

---

## Full-Stack Architecture

```
 ┌─────────────────────────────────────────────────────────────┐
 │                Browser  (localhost:5173)                     │
 │                                                             │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │           React + TypeScript  (Vite)                  │  │
 │  │                                                       │  │
 │  │  ┌──────────────────┐    ┌──────────────────────────┐ │  │
 │  │  │   useChat hook   │    │    ChatMessage           │ │  │
 │  │  │                  │    │    • user bubble (blue)  │ │  │
 │  │  │ • conversationId │    │    • AI bubble (white)   │ │  │
 │  │  │ • sendMessage()  │    │    • streaming cursor ▌  │ │  │
 │  │  │ • newChat()      │    │    • error state         │ │  │
 │  │  │ • SSE parser     │    └──────────────────────────┘ │  │
 │  │  └────────┬─────────┘                                 │  │
 │  └───────────┼───────────────────────────────────────────┘  │
 └──────────────┼──────────────────────────────────────────────┘
                │
                │  POST /api/chat/stream
                │  { message, conversationId }
                │  ──── Vite proxy (dev only) ────▶
                │
                ▼  SSE response: data:token\n\n ...
 ┌──────────────────────────────────────────────────────────────┐
 │             Spring Boot  (localhost:8080)                     │
 │                                                              │
 │  ┌─────────────────────┐   ┌──────────────────────────────┐  │
 │  │  OllamaController   │──▶│  MessageChatMemoryAdvisor    │  │
 │  │                     │   │                              │  │
 │  │  POST /api/chat     │   │  1. reads last 20 messages   │  │
 │  │  POST /api/chat/    │   │     for conversationId       │  │
 │  │        stream  (SSE)│   │  2. prepends history to      │  │
 │  │  GET  /api/{message}│   │     current prompt           │  │
 │  │  @CrossOrigin("*")  │   │  3. saves new turn after     │  │
 │  └─────────────────────┘   └──────────────┬───────────────┘  │
 │                                           │                  │
 │  ┌─────────────────────┐                  │                  │
 │  │  OllamaClientConfig │ 300 s timeout    │                  │
 │  │  ReactorNetty       │                  │                  │
 │  └─────────────────────┘                  │                  │
 └──────────────────────────────────────────┼───────────────────┘
                                            │
                                            │  POST /api/chat (stream)
                                            ▼
                           ┌─────────────────────────────────┐
                           │    Ollama  (localhost:11434)     │
                           │    Model : mistral:latest        │
                           │    Runs on local CPU / GPU       │
                           └─────────────────────────────────┘
```

---

## Backend Setup

### Step 1 — Install Java 17+

**Windows:** Download from [https://adoptium.net](https://adoptium.net) and run the installer.  
**macOS:** `brew install openjdk@17`  
**Linux:** `sudo apt update && sudo apt install openjdk-17-jdk -y`

```bash
java -version   # must print 17.x.x or higher
```

### Step 2 — Install Ollama

**Windows:** [https://ollama.com/download/windows](https://ollama.com/download/windows)  
**macOS:** `brew install ollama`  
**Linux:** `curl -fsSL https://ollama.com/install.sh | sh`

### Step 3 — Pull the Mistral model

```bash
ollama pull mistral        # ~4 GB — best balance of quality / speed
# Lighter alternatives:
# ollama pull phi3         # ~2 GB
# ollama pull gemma2:2b    # ~1.6 GB  (update application.properties to match)
```

### Step 4 — Start Ollama (keep model warm)

```powershell
# Windows PowerShell
$env:OLLAMA_KEEP_ALIVE = "-1"   # never unload the model from RAM
ollama serve
```

```bash
# macOS / Linux
OLLAMA_KEEP_ALIVE=-1 ollama serve
```

> Without `OLLAMA_KEEP_ALIVE=-1`, Ollama unloads the model after ~5 min idle, causing a 20–30 s cold-start on the next request.

### Step 5 — Run the Spring Boot API

```powershell
# Windows — Maven Wrapper (no Maven install needed)
.\mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

API is live at **http://localhost:8080**

---

## Backend API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/api/{message}?conversationId=` | Blocking — legacy, for Postman |
| `POST` | `/api/chat` | Blocking — JSON body |
| `POST` | `/api/chat/stream` | **Streaming SSE** ← used by the React UI |
| `GET` | `/swagger-ui.html` | **Swagger UI** — interactive API docs |
| `GET` | `/v3/api-docs` | OpenAPI 3.0 JSON spec |

### Swagger UI

Once the Spring Boot app is running, open **http://localhost:8080/swagger-ui.html** in your browser to explore and test all endpoints interactively — no Postman needed.

![Swagger UI](https://img.shields.io/badge/Swagger-UI-85EA2D?logo=swagger&logoColor=black)

**Example streaming request:**

```bash
curl -X POST http://localhost:8080/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message":"What is the capital of France?","conversationId":"session-1"}'
```

Streamed response:
```
data:The
data: capital
data: of
data: France
data: is
data: Paris.
```

---

## Frontend Features

| Feature | Description |
|---|---|
| 💬 **Real-time streaming** | Tokens appear word-by-word as Mistral generates — no waiting for the full response |
| 🧠 **Conversation memory** | Each session has a `conversationId`; the backend remembers the last 20 messages |
| ✨ **New Chat button** | Starts a fresh session with a new `conversationId` — previous history stays isolated on the backend |
| 🗑️ **Clear button** | Clears visible messages while keeping the same `conversationId` (backend memory intact) |
| ⏹️ **Stop generation** | Cancels mid-stream at any time |
| 💡 **Suggestion chips** | Quick-start prompts shown on the welcome screen |
| ⚡ **Auto-scroll** | Chat window follows the latest message as it streams in |
| 🔴 **Inline error display** | Ollama errors appear inside the chat bubble, not as a crash |
| ⌨️ **Keyboard shortcuts** | `Enter` to send · `Shift + Enter` for a new line |
| 🌐 **Configurable via `.env`** | App title, model badge, API URL, and port all driven by env files |

---

## Frontend — How It Connects to the Backend

The React app (`localhost:5173`) and the Spring Boot API (`localhost:8080`) are on **different ports**, which means different origins and normally triggers CORS errors.
<img width="515" height="419" alt="image" src="https://github.com/user-attachments/assets/8fa81e19-102c-46c7-a6b9-cf3e693999ec" />


**Vite's dev-server proxy** solves this transparently:

```
Browser (5173)        Vite Dev Server       Spring Boot (8080)
     │                      │                      │
     │  POST /api/chat/     │                      │
     │       stream         │                      │
     │─────────────────────▶│                      │
     │                      │  POST /api/chat/     │
     │                      │       stream         │
     │                      │─────────────────────▶│
     │                      │                      │  → Ollama
     │   data:token\n\n     │   data:token\n\n     │◀─ streams
     │◀─────────────────────│◀─────────────────────│
```

- The browser only ever talks to **`localhost:5173`** (same origin → no CORS)
- Vite silently forwards every `/api/*` request to **`BACKEND_URL`** from `.env.development`
- In production (`npm run build`), the built files are served statically — there is no proxy, so `VITE_API_BASE_URL` is set to the full Spring Boot URL and `@CrossOrigin("*")` on the controller allows the direct request

---

## Frontend — Environment Files

| File | Committed | Purpose |
|---|---|---|
| `.env` | ✅ | Shared defaults: app title, model name, endpoint paths, dev port |
| `.env.development` | ✅ | `VITE_API_BASE_URL=` (empty → proxy), `BACKEND_URL=http://localhost:8080` |
| `.env.production` | ✅ | `VITE_API_BASE_URL=http://localhost:8080` (direct call) |
| `.env.local` | ❌ gitignored | Your personal machine overrides — never committed |

**Override anything without touching committed files:**

```env
# frontend/.env.local
VITE_MODEL_NAME=phi3
VITE_APP_TITLE=MyChat
VITE_DEV_PORT=3000
BACKEND_URL=http://192.168.1.42:8080
```

---

## Frontend — Installation

The frontend uses **nodeenv** — a Python package that installs Node.js inside a Python virtual environment. This creates a fully isolated, reproducible Node.js environment with no admin rights required.

### Step 1 — Verify Python 3.8+

```bash
python --version
```

Install if missing: [https://python.org/downloads](https://python.org/downloads)  
Linux: `sudo apt install python3 python3-venv -y`

### Step 2 — Create a Python virtual environment

```bash
cd frontend
python -m venv .venv
```

### Step 3 — Activate the virtual environment

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

Your terminal prompt changes to `(.venv)` — you are now inside the isolated environment.

> **Windows — if script execution is blocked:**
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

### Step 4 — Install nodeenv

```bash
pip install nodeenv
```

### Step 5 — Install the latest Node.js into the venv

```bash
nodeenv --node=latest --prebuilt -p
```

This downloads the latest Node.js binary directly into `.venv/Scripts/` (Windows) or `.venv/bin/` (macOS/Linux). Verify:

```bash
node --version    # e.g. v25.x.x
npm  --version    # e.g. 11.x.x
```

> **Windows only — if `node` is not found after activation:**
> ```powershell
> $env:PATH = "$(Resolve-Path '.\.venv\Scripts');$env:PATH"
> node --version
> ```

### Step 6 — Install npm packages

```bash
npm install
```

### Step 7 — Start the dev server

```bash
npm run dev
```

Open **http://localhost:5173** 🎉

> Make sure Spring Boot is already running on `8080` before opening the UI.

---

## Frontend — Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with hot-reload (`http://localhost:5173`) |
| `npm run build` | TypeScript compile + Vite production bundle → `dist/` |
| `npm run preview` | Serve the production build locally to verify before deploying |

---

## Advisor Implementation — `MessageChatMemoryAdvisor`

### Why is it necessary?

LLMs are **stateless** — every HTTP request to Ollama is independent with no memory of previous calls. Without an advisor:

```
User: "My name is Sandesh"  →  Model: "Nice to meet you, Sandesh!"
User: "What is my name?"    →  Model: "I don't know your name." ❌
```

With `MessageChatMemoryAdvisor`:

```
User: "My name is Sandesh"  →  Model: "Nice to meet you, Sandesh!"
User: "What is my name?"    →  Model: "Your name is Sandesh." ✅
```

### How it works — step by step

```
POST /api/chat/stream  { "message": "Tell me a joke", "conversationId": "user-42" }

  1. Advisor reads history for "user-42" from MessageWindowChatMemory
     └─ [USER: My name is Sandesh] [ASSISTANT: Nice to meet you!]

  2. Enriched prompt is built:
     [USER]        My name is Sandesh        ← from memory
     [ASSISTANT]   Nice to meet you!         ← from memory
     [USER]        Tell me a joke            ← current message

  3. Full prompt sent to Ollama → generates: "Why can't you trust an atom?..."

  4. Advisor saves new turn back into ChatMemory for "user-42"

  5. Tokens stream back to React UI as SSE  →  appear word by word
```

### Key design decisions

| Decision | Reason |
|---|---|
| `chatMemory` is `private final` | Shared store — must never be reassigned |
| Created once in constructor | Single in-memory map keyed by `conversationId`; recreating it wipes all history |
| Advisor built **per request** | Required to pass a dynamic `conversationId` in Spring AI 1.1.x |
| `MessageWindowChatMemory` default 20 msgs | Prevents the prompt from growing unbounded and hitting Ollama's context limit |
| Frontend generates `conversationId` | `newChat()` creates a new `session-<timestamp>` — old session data persists in backend memory but is no longer referenced |

---

## Common Issues & Troubleshooting

### `400 Bad Request` from Ollama

| Cause | Fix |
|---|---|
| Model not pulled | `ollama pull mistral` |
| Ollama not running | `ollama serve` |
| Wrong model name | Match exactly what `ollama list` shows, update `application.properties` |

### Responses are slow (20–30 s on first request)

Ollama is loading the model cold. Start with `OLLAMA_KEEP_ALIVE=-1` (see Backend Setup Step 4).

### Frontend shows blank page or "Failed to fetch"

1. Confirm Spring Boot is running: `curl http://localhost:8080/`
2. Confirm the `.venv` is **activated** before running `npm run dev`
3. Check Vite terminal — proxy errors appear with a `[proxy]` prefix

### `node: command not found` after activating venv on Windows

```powershell
$env:PATH = "$(Resolve-Path '.\.venv\Scripts');$env:PATH"
```

### PowerShell `Activate.ps1` is blocked by execution policy

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## License

This project is open source and available under the [MIT License](LICENSE).
