package com.springai.springaicode;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;

@CrossOrigin(origins = "*")
@RestController
public class OllamaController {

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;

    /** Request body used by the POST endpoints (avoids URL path-encoding issues). */
    public record ChatRequest(String message, String conversationId) {}

    public OllamaController(ChatClient.Builder builder) {
        this.chatMemory = MessageWindowChatMemory.builder().build();
        this.chatClient = builder.build();
    }

    @GetMapping("/")
    public ResponseEntity<String> welcome() {
        return ResponseEntity.ok("Welcome to the Ollama Chat API!");
    }

    /**
     * Blocking endpoint.
     * Pass a conversationId query-param to keep separate histories per user/session.
     * Example: GET /api/Hello?conversationId=user-123
     */
    @GetMapping("/api/{message}")
    public ResponseEntity<String> getAnswer(
            @PathVariable String message,
            @RequestParam(defaultValue = "default") String conversationId) {
        return chat(new ChatRequest(message, conversationId));
    }

    // ── POST /api/chat — blocking ─────────────────────────────────────────────
    @PostMapping("/api/chat")
    public ResponseEntity<String> chat(@RequestBody ChatRequest req) {
        ChatResponse chatResponse = chatClient.prompt(req.message())
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(req.conversationId() != null ? req.conversationId() : "default")
                        .build())
                .call()
                .chatResponse();

        System.out.println(chatResponse != null && chatResponse.getMetadata() != null
                ? chatResponse.getMetadata().getModel() : "unknown model");

        if (chatResponse == null || chatResponse.getResult() == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Ollama returned an empty response. Is the model loaded?");
        }

        return ResponseEntity.ok(chatResponse.getResult().getOutput().getText());
    }

    // ── POST /api/chat/stream — streaming SSE ─────────────────────────────────
    @PostMapping(value = "/api/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@RequestBody ChatRequest req) {
        return chatClient.prompt(req.message())
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(req.conversationId() != null ? req.conversationId() : "default")
                        .build())
                .stream()
                .content();
    }

    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<String> handleOllamaError(WebClientResponseException ex) {
        String body = String.format(
                "Ollama returned %d %s.\nResponse body: %s\n\nIf the model is missing, run: ollama pull mistral",
                ex.getStatusCode().value(),
                ex.getStatusText(),
                ex.getResponseBodyAsString());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
}
