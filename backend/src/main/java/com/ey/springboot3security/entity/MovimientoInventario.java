package com.ey.springboot3security.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MovimientoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "inventario_id", nullable = false)
    private Inventario inventario;

    @Column(nullable = false)
    private String tipo; // ENTRADA, SALIDA o VENTA

    @Column(nullable = false)
    private Integer cantidad;

    private LocalDateTime fecha;

    @PrePersist
    void alCrear() {
        if (fecha == null || !"VENTA".equals(tipo)) {
            fecha = LocalDateTime.now();
        }
    }
}