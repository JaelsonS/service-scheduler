package com.jaelson.backend.exception;

import com.jaelson.backend.dto.error.ErrorResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Ponto único de tratamento de erros da API.
 * Sempre devolvo ErrorResponseDTO — o front conta com `code` + `fieldErrors`
 * para toast e validação inline. Nunca vazamos stack trace para o cliente.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponseDTO> handleBusinessException(
            BusinessException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                exception.getStatus(),
                exception.getCode(),
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        error -> error.getField(),
                        error -> error.getDefaultMessage() == null
                                ? "Valor inválido"
                                : error.getDefaultMessage(),
                        (firstMessage, ignoredMessage) -> firstMessage,
                        LinkedHashMap::new
                ));

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "Verifique os campos e tente novamente",
                request.getRequestURI(),
                fieldErrors
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleConstraintViolation(
            ConstraintViolationException exception,
            HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = exception.getConstraintViolations()
                .stream()
                .collect(Collectors.toMap(
                        violation -> violation.getPropertyPath().toString(),
                        violation -> violation.getMessage(),
                        (firstMessage, ignoredMessage) -> firstMessage,
                        LinkedHashMap::new
                ));

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "Verifique os campos e tente novamente",
                request.getRequestURI(),
                fieldErrors
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleHttpMessageNotReadable(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "MALFORMED_REQUEST",
                "Dados enviados estão em formato inválido",
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponseDTO> handleMissingServletRequestParameter(
            MissingServletRequestParameterException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "MISSING_PARAMETER",
                "Parâmetro obrigatório ausente: " + exception.getParameterName(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDTO> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "INVALID_PARAMETER",
                "Parâmetro inválido: " + exception.getName(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleNoResourceFound(
            NoResourceFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "RESOURCE_NOT_FOUND",
                "Recurso não encontrado",
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleDataIntegrityViolation(
            DataIntegrityViolationException exception,
            HttpServletRequest request
    ) {
        Throwable mostSpecificCause = exception.getMostSpecificCause();
        String causeMessage = mostSpecificCause != null
                ? mostSpecificCause.getMessage()
                : exception.getMessage();
        String sqlState = tryExtractPostgresSqlState(mostSpecificCause != null ? mostSpecificCause : exception);
        logger.warn("Violação de integridade no banco (sqlState={}): {}", sqlState, causeMessage);

        if ("23505".equals(sqlState)) {
            String detail = causeMessage != null ? causeMessage.toLowerCase() : "";
            if (detail.contains("revoked_refresh")) {
                // Logout duplicado — trata como sucesso sem assustar o cliente.
                return buildResponse(
                        HttpStatus.OK,
                        "TOKEN_ALREADY_REVOKED",
                        "Sessão já encerrada",
                        request.getRequestURI(),
                        Map.of()
                );
            }
            return buildResponse(
                    HttpStatus.CONFLICT,
                    "APPOINTMENT_CONFLICT",
                    "Já existe um agendamento ativo neste horário",
                    request.getRequestURI(),
                    Map.of()
            );
        }

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "DATA_INTEGRITY_VIOLATION",
                "Não foi possível salvar os dados. Tente novamente",
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleUnexpectedException(
            Exception exception,
            HttpServletRequest request
    ) {
        logger.error("Erro inesperado na aplicação", exception);

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "Algo deu errado. Tente novamente em instantes",
                request.getRequestURI(),
                Map.of()
        );
    }

    private String tryExtractPostgresSqlState(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if ("org.postgresql.util.PSQLException".equals(current.getClass().getName())) {
                try {
                    Method method = current.getClass().getMethod("getSQLState");
                    Object value = method.invoke(current);
                    return value instanceof String ? (String) value : null;
                } catch (Exception ignored) {
                    return null;
                }
            }
            current = current.getCause();
        }

        return null;
    }

    private ResponseEntity<ErrorResponseDTO> buildResponse(
            HttpStatus status,
            String code,
            String message,
            String path,
            Map<String, String> fieldErrors
    ) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                Instant.now(),
                status.value(),
                code,
                message,
                path,
                fieldErrors
        );

        return ResponseEntity.status(status).body(response);
    }
}
