package com.ey.springboot3security.controller;

import com.ey.springboot3security.dto.EncargadoDto;
import org.springframework.web.bind.annotation.*;

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

    @PutMapping("/{id}")
    public String editarCentro(@PathVariable int id, @RequestBody CentroDistribucion centroDistribucion){
        return centroService.editarCentro(id, centroDistribucion);
    }

    @PutMapping("/{id}/estado")
    public String actualizarEstado(@PathVariable int id, @RequestBody CentroDistribucion centroDistribucion){
        return centroService.actualizarEstado(id, centroDistribucion);
    }


    @GetMapping
    public List<CentroDistribucion> listarCentros(){
        return centroService.listarCentros();
    }

    @GetMapping("/encargados-disponibles")
    public List<EncargadoDto> listarEncargadosDisponibles(){
        return centroService.listarEncargadosDisponibles();
    }
}
