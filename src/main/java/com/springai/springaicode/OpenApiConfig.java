package com.springai.springaicode;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI ollamaChatOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Ollama Chat API")
                        .description("A Spring Boot REST API for chatting with a locally running LLM via Ollama. "
                                + "Supports blocking and streaming (SSE) responses with conversation memory.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Sandesh Singh")
                                .url("https://github.com/Sandeshsingh27/OllamaChatAPI")));
    }
}

