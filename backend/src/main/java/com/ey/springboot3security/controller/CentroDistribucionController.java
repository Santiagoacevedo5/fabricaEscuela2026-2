package com.ey.springboot3security.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ey.springboot3security.entity.CentroDistribucion;
import com.ey.springboot3security.entity.UserInfo;
import com.ey.springboot3security.service.CentroDistribucionService;

import java.util.List;

@RestController
@RequestMapping("/api/centros")
@CrossOrigin(origins = "http://localhost:5173")
public class CentroDistribucionController {
    private final CentroDistribucionService centroService;

    public CentroDistribucionController(CentroDistribucionService centroService){
        this.centroService = centroService;
    }

    @PostMapping
    public String registrarCentro(@RequestBody CentroDistribucion centroDistribucion){
        return centroService.registrarCentro(centroDistribucion);
    }

    @GetMapping
    public List<CentroDistribucion> listarCentros(){
        return centroService.listarCentros();
    }

    @GetMapping("/encargados-disponibles")
    public List<UserInfo> listarEncargadosDisponibles(){
        return centroService.listarEncargadosDisponibles();
    }
}
