// Ruta: backend/src/main/java/com/ey/springboot3security/entity/Producto.java
package com.ey.springboot3security.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idProducto;

    @Column(unique = true, nullable = false)
    private String identificador;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String categoria;

    private String descripcion;

    @Column(nullable = false)
    private boolean activo = true; // Por defecto el estado es activo
}