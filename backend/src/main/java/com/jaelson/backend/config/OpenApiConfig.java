package com.jaelson.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI serviceSchedulerOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("AgendaPro API")
                        .description("API REST para agendamento e gestão de serviços")
                        .version("v1")
                        .contact(new Contact().name("AgendaPro")));
    }
}
