package com.ey.springboot3security.controller;

import com.ey.springboot3security.entity.Inventario;
import com.ey.springboot3security.service.InventarioCentroService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/inventario-cd")
@CrossOrigin(origins = "http://localhost:5173")
public class InventarioCentroController {

    private final InventarioCentroService inventarioCentroService;

    public InventarioCentroController(InventarioCentroService inventarioCentroService){
        this.inventarioCentroService = inventarioCentroService;
    }

    // HUS03: endpoint cerrado. Fijaba la cantidad de un producto en el CD directamente,
    // sin dejar movimiento, así que permitía alterar existencias sin trazabilidad.
    // Las unidades entran al CD solo con /api/inventario/entradas, que sí registra el movimiento.
    @PostMapping("/{centroId}")
    public ResponseEntity<String> agregarProducto(@PathVariable Integer centroId, @RequestBody Inventario datos){
        return ResponseEntity.status(410).body(
                "Error: Este endpoint ya no se usa. Para ingresar unidades al CD use /api/inventario/entradas.");
    }

    @GetMapping("/{centroId}")
    public List<Inventario> listarInventarioCD(@PathVariable Integer centroId, Authentication authentication){
        return inventarioCentroService.listarInventarioCD(centroId, authentication.getName(), esAdmin(authentication));
    }

    private boolean esAdmin(Authentication authentication){
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}