package com.ey.springboot3security.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ey.springboot3security.repository.CentroDistribucionRepository;
import com.ey.springboot3security.repository.ProductoRepository;
import com.ey.springboot3security.repository.TiendaRepository;

@RestController
@RequestMapping("/api/resumen")
@CrossOrigin(origins = "http://localhost:5173")
public class ResumenController {

    private final TiendaRepository tiendaRepository;
    private final CentroDistribucionRepository centroRepository;
    private final ProductoRepository productoRepository;

    public ResumenController(TiendaRepository tiendaRepository,
                             CentroDistribucionRepository centroRepository,
                             ProductoRepository productoRepository) {
        this.tiendaRepository = tiendaRepository;
        this.centroRepository = centroRepository;
        this.productoRepository = productoRepository;
    }

    @GetMapping
    public Map<String, Long> obtenerResumen() {
        Map<String, Long> resumen = new HashMap<>();
        resumen.put("tiendas", tiendaRepository.count());
        resumen.put("centros", centroRepository.count());
        resumen.put("productos", productoRepository.count());
        return resumen;
    }
}