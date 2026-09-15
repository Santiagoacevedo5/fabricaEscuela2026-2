package com.ey.springboot3security.config;

import com.ey.springboot3security.entity.UserInfo;
import com.ey.springboot3security.repository.UserInfoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initAdminUser(UserInfoRepository repository, PasswordEncoder encoder) {
        return args -> {
            String adminEmail = "admin@empresa.com";

            if (repository.findByEmail(adminEmail).isEmpty()) {
                UserInfo admin = new UserInfo();
                admin.setName("Administrador");
                admin.setEmail(adminEmail);
                admin.setPassword(encoder.encode("Admin123!"));
                admin.setRoles("ROLE_ADMIN");
                repository.save(admin);
                System.out.println("✅ Usuario admin creado: " + adminEmail);
            } else {
                System.out.println("ℹ️ El admin ya existe, no se vuelve a crear.");
            }
        };
    }
}