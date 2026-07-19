package com.jaelson.backend.config;

import com.jaelson.backend.dto.error.ErrorResponseDTO;
import tools.jackson.databind.json.JsonMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final JsonMapper jsonMapper;

    public RestAuthenticationEntryPoint(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authenticationException
    ) throws IOException {
        writeError(response, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authentication is required", request);
    }

    void writeError(
            HttpServletResponse response,
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request
    ) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        jsonMapper.writeValue(response.getOutputStream(), new ErrorResponseDTO(
                Instant.now(),
                status.value(),
                code,
                message,
                request.getRequestURI(),
                Map.of()
        ));
    }
}
