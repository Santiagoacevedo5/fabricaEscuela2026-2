package com.ey.springboot3security.dto;

import lombok.Data;


@Data
public class EntradaRequest {
    private Integer centroId;
    private Long productoId;
    private Integer cantidad;
}