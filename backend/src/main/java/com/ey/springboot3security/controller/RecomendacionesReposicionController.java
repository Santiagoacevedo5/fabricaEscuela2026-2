package com.ey.springboot3security.controller;

import com.ey.springboot3security.dto.RecomendacionReposicionResponse;
import com.ey.springboot3security.entity.CentroDistribucion;
import com.ey.springboot3security.repository.CentroDistribucionRepository;
import com.ey.springboot3security.service.ReabastecimientoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/recomendaciones-reposicion")
public class RecomendacionesReposicionController {
    private final CentroDistribucionRepository centroRepository;
    private final ReabastecimientoService reabastecimientoService;

    public RecomendacionesReposicionController(CentroDistribucionRepository centroRepository,
                                              ReabastecimientoService reabastecimientoService) {
        this.centroRepository = centroRepository;
        this.reabastecimientoService = reabastecimientoService;
    }

    @GetMapping
    public List<RecomendacionReposicionResponse> listar(Authentication authentication) {
        return reabastecimientoService.listarRecomendaciones(centroDelEncargado(authentication).getId());
    }

    private CentroDistribucion centroDelEncargado(Authentication authentication) {
        return centroRepository.findByEncargado_Username(authentication.getName())
                .orElseThrow(() -> new NoSuchElementException(
                        "No tienes un centro de distribución asignado."));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> noEncontrado(NoSuchElementException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
    }
}
