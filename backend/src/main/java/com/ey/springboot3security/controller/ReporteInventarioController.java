package com.ey.springboot3security.controller;

import com.ey.springboot3security.service.ReporteInventarioService;
import com.ey.springboot3security.service.ReporteInventarioService.FilaInventario;
import com.ey.springboot3security.service.ReporteInventarioService.Ubicacion;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// HU8.2: niveles de inventario (solo admin: SecurityConfig ya exige ROLE_ADMIN en GET /api/reportes/**)
@RestController
@RequestMapping("/api/reportes")
public class ReporteInventarioController {

    private final ReporteInventarioService service;

    public ReporteInventarioController(ReporteInventarioService service) {
        this.service = service;
    }

    // Tiendas y CD para el filtro de ubicacion
    @GetMapping("/ubicaciones")
    public List<Ubicacion> ubicaciones() {
        return service.ubicaciones();
    }

    // Ejemplos: GET /api/reportes/inventario            (todas las ubicaciones)
    //           GET /api/reportes/inventario?tipo=TIENDA&ubicacionId=1
    //           GET /api/reportes/inventario?tipo=CD&ubicacionId=2
    @GetMapping("/inventario")
    public List<FilaInventario> inventario(@RequestParam(required = false) String tipo,
                                           @RequestParam(required = false) Integer ubicacionId) {
        return service.generar(tipo, ubicacionId);
    }
}
