package com.jaelson.backend.config;

import com.jaelson.backend.entity.AdminUser;
import com.jaelson.backend.repository.AdminUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
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
            logger.error("No admin user was created: ADMIN_EMAIL and ADMIN_PASSWORD must be configured in production");
            return;
        }

        adminUserRepository.save(new AdminUser(email, passwordEncoder.encode(password)));
        logger.warn("Initial admin user '{}' was created. Change its password after deployment.", email);
    }

    private boolean isProduction() {
        return Arrays.asList(environment.getActiveProfiles()).contains("prod");
    }
}
