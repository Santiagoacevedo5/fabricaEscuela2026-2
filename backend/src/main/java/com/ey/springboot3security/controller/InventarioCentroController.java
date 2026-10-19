package com.ey.springboot3security.controller;

import com.ey.springboot3security.entity.Inventario;
import com.ey.springboot3security.service.InventarioCentroService;
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

    @PostMapping("/{centroId}")
    public String agregarProducto(@PathVariable Integer centroId, Authentication authentication, @RequestBody Inventario datos){
        return inventarioCentroService.agregarProductoCD(centroId, authentication.getName(), esAdmin(authentication), datos);
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
