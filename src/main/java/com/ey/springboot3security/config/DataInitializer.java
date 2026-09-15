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

            if (repository.findByUsername("admin").isEmpty()) {
                UserInfo admin = new UserInfo();
                admin.setUsername("admin");
                admin.setName("Administrador");
                admin.setEmail("admin@empresa.com");
                admin.setPassword(encoder.encode("Admin123"));
                admin.setRoles("ROLE_ADMIN");
                repository.save(admin);
}
        };
    }
}