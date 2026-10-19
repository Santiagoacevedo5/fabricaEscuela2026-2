package com.ey.springboot3security.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CentroDistribucion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Integer id;
    private String nombre;
    private String ubicacion;
    private String estado;

    @OneToOne
    @JoinColumn(name = "encargado_id")
    @JsonIgnoreProperties({"password", "confirmarPassword", "email", "documento"})
    private UserInfo encargado;

    private LocalDate fechaRegistro;
}
