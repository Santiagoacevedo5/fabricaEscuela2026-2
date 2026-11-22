package com.ey.springboot3security.dto;

import java.time.LocalDateTime;
import java.util.List;

public class OrdenDtos {

    public record ResumenOrden(
            Long id,
            int productos,
            int unidades,
            LocalDateTime fechaCreacion,
            String estado
    ) {}

    public record MisOrdenes(
            String tienda,
            List<ResumenOrden> ordenes
    ) {}

    public record ItemOrden(
            String producto,
            String identificador,
            int cantidad
    ) {}

    public record CambioEstado(
            String estado,
            LocalDateTime fecha,
            String usuario
    ) {}

    public record DetalleOrden(
            Long id,
            String tienda,
            String estado,
            List<ItemOrden> productos,
            List<CambioEstado> historial
    ) {}

    public record RecepcionConfirmada(
            Long id,
            String tienda,
            int unidades
    ) {}
}
