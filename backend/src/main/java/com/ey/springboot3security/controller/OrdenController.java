package com.ey.springboot3security.controller;

import com.ey.springboot3security.dto.OrdenRequest;
import com.ey.springboot3security.dto.RechazoOrdenRequest;
import com.ey.springboot3security.entity.OrdenReabastecimiento;
import com.ey.springboot3security.service.OrdenService;
import com.ey.springboot3security.dto.OrdenResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes")
public class OrdenController {

    private final OrdenService ordenService;

    public OrdenController(OrdenService ordenService){
        this.ordenService = ordenService;
    }

    @PostMapping
    public ResponseEntity<OrdenReabastecimiento> crearOrden(@RequestBody OrdenRequest request,
                                                            Authentication authentication){
        return ResponseEntity.status(HttpStatus.CREATED).body(ordenService.crearOrden(request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<OrdenResponse>> listarOrdenes(Authentication authentication){

        return ResponseEntity.ok(ordenService.listarOrdenesResponse(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrdenResponse> obtenerOrden(@PathVariable Long id, Authentication authentication){

        return ResponseEntity.ok(ordenService.obtenerOrdenResponse(id, authentication.getName()));
    }

    @PutMapping("/{id}/aprobar")
    public ResponseEntity<OrdenReabastecimiento> aprobarOrden(@PathVariable Long id, Authentication authentication){
        return ResponseEntity.ok(ordenService.aprobarOrden(id, authentication.getName()));
    }

    @PutMapping("/{id}/rechazar")
    public ResponseEntity<OrdenReabastecimiento> rechazarOrden(@PathVariable Long id,
                                                               @RequestBody RechazoOrdenRequest request,
                                                               Authentication authentication){
        return ResponseEntity.ok(ordenService.rechazarOrden(id, request.getMotivo(), authentication.getName()));

    }
}
