package com.ey.springboot3security.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Inventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Solo una de las dos ubicaciones se llena: CD o tienda
    @ManyToOne
    @JoinColumn(name = "centro_distribucion_id")
    @JsonIgnoreProperties("encargado") // no exponer datos ni contraseña del encargado
    private CentroDistribucion centroDistribucion;

    @ManyToOne
    @JoinColumn(name = "tienda_id")
    @JsonIgnoreProperties("encargado")
    private Tienda tienda;

    @ManyToOne
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    private Integer cantidad;

    private LocalDate fechaCreacion;

    @PrePersist
    void alCrear() {
        fechaCreacion = LocalDate.now();
    }
}