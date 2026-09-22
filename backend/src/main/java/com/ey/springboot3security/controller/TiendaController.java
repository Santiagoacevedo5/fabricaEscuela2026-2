package com.ey.springboot3security.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ey.springboot3security.entity.Tienda;
import com.ey.springboot3security.service.TiendaService;

@RestController
@RequestMapping("/api/tiendas")
public class TiendaController {

    private final TiendaService service;

    public TiendaController(TiendaService service) {
        this.service = service;
    }

    @PostMapping
    public Tienda registrarTienda(@RequestBody Tienda tienda) {
        return service.registrarTienda(tienda);
    }

    @GetMapping
    public List<Tienda> listarTiendas() {
        return service.listarTiendas();
    }
}