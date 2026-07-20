package com.jaelson.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClientRegisterRequestDTO(
        @NotBlank(message = "Informe o nome")
        @Size(min = 2, max = 120, message = "Nome deve ter entre 2 e 120 caracteres")
        String fullName,

        @NotBlank(message = "Informe o telefone")
        @Pattern(regexp = "^[0-9()+.\\- ]{10,30}$", message = "Telefone inválido")
        String phone,

        @NotBlank(message = "Informe o e-mail")
        @Email(message = "E-mail inválido")
        @Size(max = 255, message = "E-mail muito longo")
        String email,

        @NotBlank(message = "Informe a senha")
        @Size(min = 8, max = 72, message = "Senha deve ter entre 8 e 72 caracteres")
        String password
) {
}
