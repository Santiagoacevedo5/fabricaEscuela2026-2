package com.ey.springboot3security.controller;

import com.ey.springboot3security.dto.OrdenDtos.DetalleOrden;
import com.ey.springboot3security.dto.OrdenDtos.MisOrdenes;
import com.ey.springboot3security.dto.OrdenDtos.RecepcionConfirmada;
import com.ey.springboot3security.service.OrdenTiendaService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// HU7.3: la tienda sale siempre del token (usuario autenticado).
// El rol ENCARGADO_TIENDA se exige en SecurityConfig.
@RestController
@RequestMapping("/api/mis-ordenes")
public class OrdenTiendaController {

    private final OrdenTiendaService service;

    public OrdenTiendaController(OrdenTiendaService service) {
        this.service = service;
    }

    @GetMapping
    public MisOrdenes misOrdenes(Authentication auth) {
        return service.misOrdenes(auth.getName());
    }

    @GetMapping("/{id}")
    public DetalleOrden detalle(@PathVariable Long id, Authentication auth) {
        return service.detalle(id, auth.getName());
    }

    @PostMapping("/{id}/recepcion")
    public RecepcionConfirmada confirmarRecepcion(@PathVariable Long id, Authentication auth) {
        return service.confirmarRecepcion(id, auth.getName());
    }
}
