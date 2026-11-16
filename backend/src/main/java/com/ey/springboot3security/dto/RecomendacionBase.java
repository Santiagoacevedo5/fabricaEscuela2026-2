package com.ey.springboot3security.dto;

public record RecomendacionBase(
        Integer reglaId,
        Long productoId,
        String producto,
        String identificador,
        Integer tiendaId,
        String tienda,
        String region,
        Integer stockActual,
        Integer umbralMinimo,
        Integer stockCentro,
        Integer cantidadReposicion) {
}
