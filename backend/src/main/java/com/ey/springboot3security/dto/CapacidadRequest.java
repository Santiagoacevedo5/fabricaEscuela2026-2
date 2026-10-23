package com.ey.springboot3security.dto;

import lombok.Data;


@Data
public class CapacidadRequest {
    private String tipo;
    private Integer ubicacionId;
    private Integer capacidadMinima;
    private Integer capacidadMaxima;
    private Boolean activo;
}