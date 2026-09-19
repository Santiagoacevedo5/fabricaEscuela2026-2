package com.ey.springboot3security.service;

import com.ey.springboot3security.entity.UserInfo;
import com.ey.springboot3security.repository.UserInfoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UserDetailsService;
import java.util.Optional;
import java.util.List;

@Service
public class UserInfoService implements UserDetailsService {

    private final UserInfoRepository repository;
    private final PasswordEncoder encoder;

    @Autowired
    public UserInfoService(UserInfoRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    
    @Override
    public UserDetails loadUserByUsername(String username)
        throws UsernameNotFoundException {

    UserInfo user = repository.findByUsername(username)
            .orElseThrow(() ->
                    new UsernameNotFoundException(
                            "User not found with username: " + username));

    return new UserInfoDetails(user);
}

    public String addUser(UserInfo userInfo) {
        if (userInfo.getName() == null || userInfo.getName().isBlank()
                || userInfo.getEmail() == null || userInfo.getEmail().isBlank()
                || userInfo.getDocumento() == null || userInfo.getDocumento().isBlank()
                || userInfo.getUsername() == null || userInfo.getUsername().isBlank()
                || userInfo.getPassword() == null || userInfo.getPassword().isBlank()
                || userInfo.getRoles() == null || userInfo.getRoles().isBlank()) {
            return "Todos los campos son obligatorios";
        }

        if (repository.existsByUsername(userInfo.getUsername())) {
            return "El usuario ya existe";
        }
        if (repository.existsByEmail(userInfo.getEmail())) {
            return "El correo ya existe";
        }
        if (repository.existsByDocumento(userInfo.getDocumento())) {
            return "El documento ya existe";
        }
        if (!userInfo.getPassword().equals(userInfo.getConfirmarPassword())) {
            return "Las contraseñas no coinciden";
        }
        userInfo.setPassword(encoder.encode(userInfo.getPassword()));
        if (userInfo.getEstado() == null || userInfo.getEstado().isBlank()) {
            userInfo.setEstado("ACTIVO");
        }
        if (userInfo.getFechaRegistro() == null) {
            userInfo.setFechaRegistro(java.time.LocalDate.now());
        }
        repository.save(userInfo);
        return "Empleado registrado correctamente";
    }

    public List<UserInfo> getAllUsers() {
        return repository.findAll();
    }
}