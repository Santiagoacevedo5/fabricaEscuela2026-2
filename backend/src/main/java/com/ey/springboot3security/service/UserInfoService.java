package com.ey.springboot3security.service;

import com.ey.springboot3security.entity.UserInfo;
import com.ey.springboot3security.entity.EmpleadoUpdateRequest;
import com.ey.springboot3security.repository.CentroDistribucionRepository;
import com.ey.springboot3security.repository.TiendaRepository;
import com.ey.springboot3security.repository.UserInfoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.userdetails.UserDetailsService;
import java.util.Optional;
import java.util.List;

@Service
public class UserInfoService implements UserDetailsService {

    private final UserInfoRepository repository;
    private final TiendaRepository tiendaRepository;
    private final CentroDistribucionRepository centroRepository;
    private final PasswordEncoder encoder;

    @Autowired
    public UserInfoService(
            UserInfoRepository repository,
            TiendaRepository tiendaRepository,
            CentroDistribucionRepository centroRepository,
            PasswordEncoder encoder) {
        this.repository = repository;
        this.tiendaRepository = tiendaRepository;
        this.centroRepository = centroRepository;
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
                || userInfo.getContacto() == null || userInfo.getContacto().isBlank()
                || userInfo.getUsername() == null || userInfo.getUsername().isBlank()
                || userInfo.getPassword() == null || userInfo.getPassword().isBlank()
                || userInfo.getRoles() == null || userInfo.getRoles().isBlank()) {
            return "Todos los campos son obligatorios";
        }

        if (!userInfo.getContacto().matches("\\d{10}")) {
            return "El contacto debe tener 10 dígitos";
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

    public void deleteEmployee(String username) {
        UserInfo employee = repository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado"));

        if (tiendaRepository.existsByEncargado_Id(employee.getId())
                || centroRepository.existsByEncargado_Id(employee.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar el empleado porque está asignado a una tienda o centro de distribución"
            );
        }

        repository.delete(employee);
    }

    public String updateEmployee(String username, EmpleadoUpdateRequest request) {
        UserInfo employee = repository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empleado no encontrado"));

        if (request == null || request.email() == null || request.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo es obligatorio");
        }
        String email = request.email().trim();
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo no es válido");
        }
        if (request.contacto() == null || !request.contacto().matches("\\d{10}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El contacto debe tener 10 dígitos");
        }
        if (request.roles() == null || !List.of("ROLE_ADMIN", "ENCARGADO_TIENDA", "ENCARGADO_CD").contains(request.roles())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rol no es válido");
        }
        if (repository.existsByEmailAndUsernameNot(email, username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya existe");
        }

        employee.setEmail(email);
        employee.setContacto(request.contacto());
        employee.setRoles(request.roles());
        repository.save(employee);
        return "Empleado actualizado correctamente";
    }
}