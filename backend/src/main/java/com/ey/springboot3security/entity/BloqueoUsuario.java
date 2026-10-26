package com.ey.springboot3security.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

// HUS-01: auditoría de cada bloqueo por intentos fallidos
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BloqueoUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private LocalDateTime fecha;
}
