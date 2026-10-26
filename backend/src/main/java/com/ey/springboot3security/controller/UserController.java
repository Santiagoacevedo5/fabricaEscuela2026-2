package com.ey.springboot3security.controller;

import com.ey.springboot3security.entity.AuthRequest;
import com.ey.springboot3security.entity.EmpleadoUpdateRequest;
import com.ey.springboot3security.entity.UserInfo;
import com.ey.springboot3security.service.IntentosLoginService;
import com.ey.springboot3security.service.JwtService;
import com.ey.springboot3security.service.UserInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class UserController {

    private final UserInfoService service;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final IntentosLoginService intentosLogin;

    private static final String MENSAJE_BLOQUEO =
            "Usuario bloqueado por 15 minutos por intentos fallidos. Intenta más tarde.";

    @GetMapping("/welcome")
    public String welcome() {
        return "Welcome this endpoint is not secure";
    }

    @PostMapping("/addNewUser")
    public String addNewUser(@RequestBody UserInfo userInfo) {
        return service.addUser(userInfo);
    }

    @GetMapping("/users")
    public List<UserInfo> getAllUsers() {
        return service.getAllUsers();
    }

    @PutMapping("/users/{username}")
    public String updateEmployee(@PathVariable String username, @RequestBody EmpleadoUpdateRequest request) {
        return service.updateEmployee(username, request);
    }

    @DeleteMapping("/users/{username}")
    public void deleteEmployee(@PathVariable String username) {
        service.deleteEmployee(username);
    }

    // Removed the role checks here as they are already managed in SecurityConfig

    @PostMapping("/logout")
    public void logout(@RequestHeader("Authorization") String authHeader) {
        jwtService.revokeToken(authHeader.substring(7));
    }

    @PostMapping("/generateToken")
    public String authenticateAndGetToken(@RequestBody AuthRequest authRequest) {
        String username = Objects.toString(authRequest.getUsername(), "");
        // HUS-01: bloqueado se niega antes de mirar la contraseña, aunque sea la correcta
        if (intentosLogin.estaBloqueado(username)) {
            throw new ResponseStatusException(HttpStatus.LOCKED, MENSAJE_BLOQUEO);
        }
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, authRequest.getPassword())
            );
        } catch (AuthenticationException e) {
            if (intentosLogin.registrarFallo(username)) {
                throw new ResponseStatusException(HttpStatus.LOCKED, MENSAJE_BLOQUEO);
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos");
        }
        intentosLogin.registrarExito(username);
        return jwtService.generateToken(username);
    }

    @GetMapping("/me")
    public Map<String, Object> getCurrentUser(Authentication authentication) {
        return Map.of(
                "username", authentication.getName(),
                "roles", authentication.getAuthorities().stream()
                        .map(authority -> authority.getAuthority())
                        .toList());
    }
}
