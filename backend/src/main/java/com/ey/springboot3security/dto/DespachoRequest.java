package com.ey.springboot3security.dto;

import lombok.Data;

// Body de POST /api/inventario/despachos: mover stock de un CD a una de sus tiendas
@Data
public class DespachoRequest {
    private Long inventarioId; // fila de inventario del CD (producto + CD)
    private Integer tiendaId;  // tienda destino
    private Integer cantidad;  // unidades a despachar
}
