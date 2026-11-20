package com.ey.springboot3security.dto;

import lombok.Data;
import java.util.List;

//Body de POST /api/ordenes: crear una orden de reabastecimiento

@Data
public class OrdenRequest {
    private Integer tiendaId;
    private List<Item> items;

    @Data
    public static class Item{
        private Long productoId;
        private Integer cantidad;
    }
}
