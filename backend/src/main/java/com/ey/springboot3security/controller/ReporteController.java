package com.ey.springboot3security.controller;

import com.ey.springboot3security.entity.Tienda;
import com.ey.springboot3security.repository.TiendaRepository;
import com.ey.springboot3security.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

// HU8.1: reportes (solo admin, ver SecurityConfig)
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    private final ReporteService reporteService;
    private final TiendaRepository tiendaRepository;

    // Ejemplo: GET /api/reportes/rotacion?desde=2026-11-01&hasta=2026-11-30&tiendaId=1 (tiendaId opcional)
    @GetMapping("/rotacion")
    public ResponseEntity<?> rotacion(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer tiendaId) {

        // Escenario 3: rango inválido, no se genera el reporte
        if (desde.isAfter(hasta)) {
            return ResponseEntity.badRequest().body("Error: La fecha inicial no puede ser posterior a la fecha final.");
        }
        String tienda = "Todas las tiendas";
        if (tiendaId != null) {
            Tienda encontrada = tiendaRepository.findById(tiendaId).orElse(null);
            if (encontrada == null) {
                return ResponseEntity.status(404).body("Error: La tienda no existe.");
            }
            tienda = encontrada.getNombre();
        }

        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("tienda", tienda);
        respuesta.put("desde", desde.toString());
        respuesta.put("hasta", hasta.toString());
        respuesta.put("productos", reporteService.rotacion(tiendaId, desde, hasta));
        return ResponseEntity.ok(respuesta);
    }
}
