package com.jaelson.backend.config;

import com.jaelson.backend.entity.AdminUser;
import com.jaelson.backend.repository.AdminUserRepository;
import org.slf4j.Logger; // Pacote de logging
import org.slf4j.LoggerFactory; // Pacote de logging
import org.springframework.beans.factory.annotation.Value; // Para injetar valores de propriedades
import org.springframework.boot.ApplicationArguments; // Para lidar com argumentos de inicialização
import org.springframework.boot.ApplicationRunner; // Para executar código após a inicialização do aplicativo
import org.springframework.core.env.Environment; // Para acessar o ambiente e perfis ativos
import org.springframework.security.crypto.password.PasswordEncoder; // Para codificar senhas
import org.springframework.stereotype.Component; // Marca a classe como um componente Spring

import java.util.Arrays; // Para trabalhar com arrays

/**
 * Cria o primeiro admin só se a tabela estiver vazia.
 * Em prod eu bloqueio as credenciais padrão de desenvolvimento —
 * sem isso alguém poderia subir o Render e ficar com admin@agendapro.local aberto.
 */
@Component // Marca a classe como um componente Spring para que seja detectada e gerenciada pelo Spring Boot
public class AdminUserBootstrap implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminUserBootstrap.class);
    private static final String DEVELOPMENT_EMAIL = "admin@agendapro.local";
    private static final String DEVELOPMENT_PASSWORD = "Admin@12345";

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;
    private final String email;
    private final String password;

    public AdminUserBootstrap(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            Environment environment,
            @Value("${app.admin.email}") String email,
            @Value("${app.admin.password}") String password
    ) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminUserRepository.count() > 0) {
            return;
        }

        if (isProduction() && DEVELOPMENT_EMAIL.equals(email) && DEVELOPMENT_PASSWORD.equals(password)) {
            logger.error(
                    "Admin inicial não foi criado: em produção configure ADMIN_EMAIL e ADMIN_PASSWORD "
                            + "(não use as credenciais padrão de desenvolvimento)"
            );
            return;
        }

        adminUserRepository.save(new AdminUser(email, passwordEncoder.encode(password)));
        logger.warn(
                "Admin inicial '{}' criado. Troque a senha depois do primeiro acesso.",
                email
        );
    }

    private boolean isProduction() {
        return Arrays.asList(environment.getActiveProfiles()).contains("prod");
    }
}
