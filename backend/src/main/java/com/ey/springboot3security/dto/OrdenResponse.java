package com.ey.springboot3security.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrdenResponse {

    private Long id;
    private String estado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaRevision;
    private String revisadoPor;
    private String motivoRechazo;

    private String enviadoPor;
    private LocalDateTime fechaEnvio;

    private Long tiendaId;
    private String tiendaNombre;

    private Integer centroId;
    private String centroNombre;

    private String encargadoTiendaNombre;
    private String encargadoTiendaUsername;

    private String encargadoCentroNombre;
    private String encargadoCentroUsername;

    private List<Item> items;

    @Data
    public static class Item {

        private Long productoId;
        private String productoNombre;
        private Integer cantidad;

    }
}
