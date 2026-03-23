package com.springai.springaicode;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;

@RestController
public class OllamaController {

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;

    public OllamaController(ChatClient.Builder builder) {
        // MessageWindowChatMemory keeps the last 20 messages by default.
        // Shared across requests; isolation is achieved via conversationId per request.
        this.chatMemory = MessageWindowChatMemory.builder().build();

        // Build the ChatClient WITHOUT a default advisor so that each request
        // can supply its own conversationId-scoped advisor below.
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

        ChatResponse chatResponse = chatClient.prompt(message)
                // Build a fresh advisor with the caller's conversationId.
                // The shared chatMemory keeps history per conversationId.
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(conversationId)
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

    /**
     * Streaming endpoint – tokens arrive as SSE events.
     * Pass conversationId to keep separate memory per user/session.
     * Example: GET /api/stream/Hello?conversationId=user-123
     */
    @GetMapping(value = "/api/stream/{message}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> getStreamAnswer(
            @PathVariable String message,
            @RequestParam(defaultValue = "default") String conversationId) {

        return chatClient.prompt(message)
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory)
                        .conversationId(conversationId)
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
