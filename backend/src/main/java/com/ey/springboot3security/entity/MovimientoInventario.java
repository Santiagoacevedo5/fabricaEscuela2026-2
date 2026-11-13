package com.ey.springboot3security.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import java.time.LocalDateTime;

@Entity
@Immutable // HUS03: un movimiento registrado no se puede modificar
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

    // HUS03: quién hizo el movimiento (sale del token, nunca del formulario)
    private String usuario;

    private LocalDateTime fecha;

    // HUS03: la fecha y hora siempre las pone el servidor
    @PrePersist
    void alCrear() {
        fecha = LocalDateTime.now();
    }
}