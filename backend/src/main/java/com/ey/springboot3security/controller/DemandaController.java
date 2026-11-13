package com.ey.springboot3security.controller;

import com.ey.springboot3security.dto.DemandaProducto;
import com.ey.springboot3security.entity.Producto;
import com.ey.springboot3security.entity.Tienda;
import com.ey.springboot3security.repository.ProductoRepository;
import com.ey.springboot3security.repository.TiendaRepository;
import com.ey.springboot3security.service.DemandaService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// HU5.1: patrones de demanda por ubicación (encargado de CD y admin)
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/demanda")
public class DemandaController {

    private static final Logger log = LoggerFactory.getLogger(DemandaController.class);

    private final DemandaService demandaService;
    private final TiendaRepository tiendaRepository;
    private final ProductoRepository productoRepository;

    // Tiendas que el usuario puede elegir en la pantalla de demanda
    @GetMapping("/tiendas")
    public ResponseEntity<?> tiendas(Authentication auth) {
        List<Map<String, Object>> tiendas = demandaService.tiendasVisibles(auth).stream()
                .map(t -> {
                    Map<String, Object> fila = new LinkedHashMap<>();
                    fila.put("id", t.getId());
                    fila.put("nombre", t.getNombre());
                    return fila;
                })
                .toList();
        return ResponseEntity.ok(tiendas);
    }

    // Escenarios 1 y 2: unidades vendidas por producto en una tienda y un rango de fechas.
    // Ejemplo: GET /api/demanda?tiendaId=1&desde=2026-11-01&hasta=2026-11-30
    @GetMapping
    public ResponseEntity<?> demandaPorTienda(
            @RequestParam Integer tiendaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            Authentication auth) {

        if (desde.isAfter(hasta)) {
            return ResponseEntity.badRequest().body("Error: La fecha inicial no puede ser posterior a la fecha final.");
        }
        if (!tiendaRepository.existsById(tiendaId)) {
            return ResponseEntity.status(404).body("Error: La tienda no existe.");
        }

        // El encargado de CD solo puede consultar las tiendas de su CD
        Tienda tienda = demandaService.tiendasVisibles(auth).stream()
                .filter(t -> t.getId().equals(tiendaId))
                .findFirst()
                .orElse(null);
        if (tienda == null) {
            return accesoDenegado(auth, "Tienda " + tiendaId);
        }

        List<DemandaProducto> productos = demandaService.demandaPorTienda(tiendaId, desde, hasta);

        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("tiendaId", tienda.getId());
        respuesta.put("tienda", tienda.getNombre());
        respuesta.put("desde", desde.toString());
        respuesta.put("hasta", hasta.toString());
        respuesta.put("productos", productos);
        // Escenario 2: periodo sin ventas
        if (productos.isEmpty()) {
            respuesta.put("mensaje", "No hay ventas registradas en este periodo");
        }
        return ResponseEntity.ok(respuesta);
    }

    // Escenario 3: unidades vendidas de un producto en cada tienda, para comparar.
    // Ejemplo: GET /api/demanda/comparar?productoId=1&desde=2026-11-01&hasta=2026-11-30
    @GetMapping("/comparar")
    public ResponseEntity<?> compararTiendas(
            @RequestParam Long productoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            Authentication auth) {

        if (desde.isAfter(hasta)) {
            return ResponseEntity.badRequest().body("Error: La fecha inicial no puede ser posterior a la fecha final.");
        }
        Producto producto = productoRepository.findById(productoId).orElse(null);
        if (producto == null) {
            return ResponseEntity.status(404).body("Error: El producto no existe.");
        }

        List<Tienda> tiendas = demandaService.tiendasVisibles(auth);
        if (!DemandaService.esAdmin(auth) && tiendas.isEmpty()) {
            return accesoDenegado(auth, "Comparar producto " + productoId);
        }

        List<Map<String, Object>> filas = demandaService.compararTiendas(productoId, tiendas, desde, hasta);

        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("productoId", producto.getIdProducto());
        respuesta.put("producto", producto.getNombre());
        respuesta.put("desde", desde.toString());
        respuesta.put("hasta", hasta.toString());
        respuesta.put("tiendas", filas);
        boolean sinVentas = filas.stream().allMatch(f -> ((Long) f.get("unidades")) == 0L);
        if (sinVentas) {
            respuesta.put("mensaje", "No hay ventas registradas en este periodo");
        }
        return ResponseEntity.ok(respuesta);
    }

    // Responde 403 y deja registrado el intento (mismo criterio de la HUS-02)
    private ResponseEntity<?> accesoDenegado(Authentication auth, String ubicacion) {
        log.warn("ACCESO DENEGADO | usuario={} | accion=DEMANDA | ubicacion={} | fecha={}",
                auth.getName(), ubicacion, LocalDateTime.now());
        return ResponseEntity.status(403).body("Acceso no autorizado: solo puede consultar las tiendas de su centro de distribución.");
    }
}