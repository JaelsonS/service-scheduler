package com.jaelson.backend.config;

import org.springframework.beans.factory.annotation.Value; // Para injetar valores de propriedades
import org.springframework.context.annotation.Bean; // Para definir beans no contexto do Spring
import org.springframework.context.annotation.Configuration; // Marca a classe como uma configuração do Spring
import org.springframework.data.auditing.DateTimeProvider; // Para fornecer a data e hora atual para auditoria
import org.springframework.data.jpa.repository.config.EnableJpaAuditing; // Habilita a auditoria JPA, permitindo que campos como createdAt e updatedAt sejam preenchidos automaticamente

import java.time.Clock; // Para fornecer a hora atual com base em um fuso horário específico
import java.time.LocalDateTime; // Para representar data e hora sem fuso horário
import java.time.ZoneId; // Para representar um fuso horário específico
import java.util.Optional; // Para lidar com valores que podem ou não estar presentes, evitando NullPointerException

@Configuration
@EnableJpaAuditing(dateTimeProviderRef = "auditingDateTimeProvider")
public class ClockConfig {

    @Bean
    public Clock clock(@Value("${app.timezone:America/Sao_Paulo}") String timezone) {
        return Clock.system(ZoneId.of(timezone));
    }

    @Bean
    public DateTimeProvider auditingDateTimeProvider(Clock clock) {
        return () -> Optional.of(LocalDateTime.now(clock));
    }
}
