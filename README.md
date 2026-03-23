# OllamaChatAPI

A **Spring Boot REST API** that lets you chat with a locally running LLM (Large Language Model) using **[Ollama](https://ollama.com/)** and **[Spring AI](https://spring.io/projects/spring-ai)**.  
The API supports both a **blocking endpoint** (full response at once) and a **streaming endpoint** (tokens arrive in real time), and optionally keeps per-session **conversation memory** via a `MessageChatMemoryAdvisor`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.5.0 |
| AI Integration | Spring AI 1.1.3 |
| LLM Runtime | Ollama (local) |
| Default Model | Mistral 7B |
| Build Tool | Maven (Maven Wrapper included) |

---

## Project Structure

```
src/
├── main/
│   ├── java/com/springai/springaicode/
│   │   ├── SpringAiCodeApplication.java   # Entry point
│   │   ├── OllamaController.java          # REST endpoints
│   │   └── OllamaClientConfig.java        # WebClient timeout config
│   └── resources/
│       └── application.properties         # App & Ollama settings
```

---

## Prerequisites

You need **three** things installed before running the project:

1. **Java 17+**
2. **Apache Maven** *(or just use the included Maven Wrapper — no install needed)*
3. **Ollama** *(runs the LLM locally)*

---

## Step 1 — Install Java 17+

### Windows
1. Download from [https://adoptium.net](https://adoptium.net) (Eclipse Temurin JDK 17 or higher).
2. Run the installer and follow the prompts.
3. Verify:
```powershell
java -version
# Should print: openjdk version "17.x.x" ...
```

### macOS (Homebrew)
```bash
brew install openjdk@17
java -version
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update && sudo apt install openjdk-17-jdk -y
java -version
```

---

## Step 2 — Install Maven (Optional)

This project includes a **Maven Wrapper** (`mvnw` / `mvnw.cmd`), so you do **not** need to install Maven separately.  
If you prefer a global installation:

- **Windows:** Download from [https://maven.apache.org/download.cgi](https://maven.apache.org/download.cgi), extract, and add `bin/` to your `PATH`.
- **macOS:** `brew install maven`
- **Linux:** `sudo apt install maven -y`

Verify:
```bash
mvn -version
```

---

## Step 3 — Install Ollama

Ollama runs LLMs locally on your machine. No internet connection is needed at inference time once the model is downloaded.

### Windows
Download and run the installer from: [https://ollama.com/download/windows](https://ollama.com/download/windows)

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Verify Ollama is running:
```bash
ollama --version
```

---

## Step 4 — Pull the Mistral Model

After installing Ollama, download the Mistral 7B model (~4 GB):

```bash
ollama pull mistral
```

Verify it was downloaded:
```bash
ollama list
# NAME              ID              SIZE    MODIFIED
# mistral:latest    ...             4.1 GB  ...
```

> **Want a smaller/faster model?**  
> Replace `mistral` with `phi3` (~2 GB) or `gemma2:2b` (~1.6 GB) and update `application.properties` accordingly.

---

## Step 5 — Start Ollama 
**Windows PowerShell:**
```powershell
ollama serve
```

**macOS / Linux:**
```bash
ollama serve
```

> If you installed Ollama as a background service on Windows, it starts automatically — open Task Manager → Services → find `Ollama` → right-click → Stop, then run the command above.

---

## Step 6 — Clone & Configure

```bash
git clone https://github.com/Sandeshsingh27/OllamaChatAPI.git
cd OllamaChatAPI
```

Open `src/main/resources/application.properties` and verify:

```properties
spring.application.name=SpringAICode

# Change this if you pulled a different model
spring.ai.ollama.chat.options.model=mistral
```

---

## Step 7 — Build & Run

**Using Maven Wrapper (recommended — no Maven install needed):**

```powershell
# Windows
.\mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

**Using installed Maven:**
```bash
mvn spring-boot:run
```

The app starts on **http://localhost:8080** by default.

---

## API Endpoints

### `GET /`
Health check / welcome message.

```
GET http://localhost:8080/
→ 200 OK: "Welcome to the Ollama Chat API!"
```

---

### `GET /api/{message}`
**Blocking endpoint.** Waits for the full LLM response before returning.

```
GET http://localhost:8080/api/What is the capital of France?
→ 200 OK: "The capital of France is Paris."
```

> ⚠️ For long or complex questions this can take 30+ seconds depending on your hardware.  
> Use the streaming endpoint below for a better experience.

**With conversation memory** (see Advisor section):
```
GET http://localhost:8080/api/My name is Sandesh?conversationId=session-1
GET http://localhost:8080/api/What is my name?conversationId=session-1
→ "Your name is Sandesh."
```

---

### `GET /api/stream/{message}` *(Streaming)*
**Streaming endpoint.** Returns tokens as **Server-Sent Events (SSE)** — you see the first word in ~1 second instead of waiting for the full response.

```
GET http://localhost:8080/api/stream/Explain quantum computing
```

**In Postman / Insomnia:**
- Method: `GET`
- URL: `http://localhost:8080/api/stream/Explain quantum computing`
- The response panel fills in real-time as tokens stream in.

**With conversation memory:**
```
GET http://localhost:8080/api/stream/Who am I??conversationId=session-1
```

---

## Advisor Implementation — `MessageChatMemoryAdvisor`

### What is an Advisor?

In Spring AI, an **Advisor** is middleware that wraps every call to the LLM.  
It can inspect and modify the **prompt before** it is sent, and inspect the **response after** it is received.

`MessageChatMemoryAdvisor` is a built-in Spring AI advisor that gives the model **short-term memory** — it automatically:
1. **Reads** the N most recent messages from a `ChatMemory` store for the given `conversationId`.
2. **Injects** those messages into the current prompt so the model has context from earlier turns.
3. **Saves** the new user message + model reply back into `ChatMemory` after each call.

### Why Is It Necessary?

LLMs are **stateless by design** — every call to `POST /api/chat` is completely independent.  
Without an advisor:

```
User:  "My name is Sandesh"   → Model: "Nice to meet you, Sandesh!"
User:  "What is my name?"     → Model: "I don't know your name." ❌
```

With `MessageChatMemoryAdvisor`:

```
User:  "My name is Sandesh"   → Model: "Nice to meet you, Sandesh!"
User:  "What is my name?"     → Model: "Your name is Sandesh." ✅
```

The advisor bridges the gap between the stateless HTTP API and a stateful conversation experience.

---

### How It Works — Step by Step

```
Request: GET /api/Tell me a joke?conversationId=user-42

1. ChatClient calls MessageChatMemoryAdvisor.before(request)
   └─ Reads previous messages for conversationId="user-42" from ChatMemory
   └─ Prepends them to the current prompt:
        [SYSTEM] You are a helpful assistant.
        [USER]   My favourite topic is science.       ← from memory
        [ASSISTANT] Great, I love science too!        ← from memory
        [USER]   Tell me a joke                       ← current message

2. Full enriched prompt → sent to Ollama (mistral)

3. Ollama returns: "Why can't you trust an atom? Because they make up everything!"

4. MessageChatMemoryAdvisor.after(response)
   └─ Saves [USER: Tell me a joke] + [ASSISTANT: Why can't...] into ChatMemory

5. Response returned to caller.
```

---

### Implementation in Code

```java
@RestController
public class OllamaController {

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;   // in-memory store, shared across requests

    public OllamaController(ChatClient.Builder builder) {
        // MessageWindowChatMemory keeps the last 20 messages (configurable).
        // One instance is shared; histories are isolated by conversationId.
        this.chatMemory = MessageWindowChatMemory.builder().build();

        // Build ChatClient without a fixed advisor — each request supplies its own.
        this.chatClient = builder.build();
    }

    @GetMapping("/api/{message}")
    public ResponseEntity<String> getAnswer(
            @PathVariable String message,
            @RequestParam(defaultValue = "default") String conversationId) {

        return ResponseEntity.ok(
            chatClient.prompt(message)
                // A fresh advisor is built per request, scoped to conversationId.
                // The shared chatMemory still holds all history across requests.
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(conversationId)   // ← key line
                        .build())
                .call()
                .content()
        );
    }
}
```

#### Key design decisions explained

| Decision | Reason |
|---|---|
| `chatMemory` is `private final` | It is a shared store — must not be reassigned. |
| `chatMemory` is created **once** in the constructor | All conversations are stored in one in-memory map, keyed by `conversationId`. Creating it once avoids wiping history on every request. |
| Advisor is built **per request** | This is the correct way to pass a dynamic `conversationId` in Spring AI 1.1.x. The advisor is a lightweight wrapper; only the `chatMemory` is expensive. |
| `conversationId` is a **query parameter** | Lets each client (user, browser tab, test session) maintain an independent conversation thread. |
| Default `conversationId = "default"` | Ensures the endpoint still works without the param (useful for quick tests). |

#### Window size

`MessageWindowChatMemory` keeps the **last N messages** (default: 20). Older messages are automatically evicted. To customise:

```java
this.chatMemory = MessageWindowChatMemory.builder()
        .maxMessages(10)   // keep last 10 messages
        .build();
```
---

## How the Pieces Fit Together

```
Postman / Browser
      │
      │  GET /api/{message}?conversationId=xyz
      ▼
┌─────────────────────────────────────┐
│         OllamaController            │
│  - builds MessageChatMemoryAdvisor  │
│  - calls ChatClient.prompt()        │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│      MessageChatMemoryAdvisor       │  ← reads/writes MessageWindowChatMemory
│  1. prepend history to prompt       │
│  2. pass enriched prompt through    │
│  3. save new turn after response    │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│     Spring AI OllamaChatModel       │  ← OllamaClientConfig sets 300s read timeout
│  POST http://localhost:11434/api/chat│
└────────────────┬────────────────────┘
                 │
                 ▼
        Ollama (mistral:latest)
         running locally
```

---

## License

This project is open source and available under the [MIT License](LICENSE).

