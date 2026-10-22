package com.ey.springboot3security.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Tienda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nombre;
    private String direccion;
    private String region;

    @OneToOne
    @JoinColumn(name = "encargado_id")
    @JsonIgnoreProperties({"password", "confirmarPassword"})
    private UserInfo encargado;

    // CD que abastece a esta tienda (muchas tiendas -> un CD)
    @ManyToOne
    @JoinColumn(name = "centro_distribucion_id")
    @JsonIgnoreProperties("encargado")
    private CentroDistribucion centroDistribucion;

    // Nuevo campo para HU3.5 (por defecto activa)
    private Integer capacidadMinima;
    private Integer capacidadMaxima;
    private Boolean activa = true;
}