// Ruta: src/main/java/com/ey/springboot3security/controller/ReglaReposicionController.java
package com.ey.springboot3security.controller;

import com.ey.springboot3security.entity.ReglaReposicion;
import com.ey.springboot3security.service.ReglaReposicionService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/reglas-reposicion")
@CrossOrigin(origins = "http://localhost:5173")
public class ReglaReposicionController {
    private final ReglaReposicionService reglaService;

    public ReglaReposicionController(ReglaReposicionService reglaService) {
        this.reglaService = reglaService;
    }

    @PostMapping
    public String registrarRegla(@RequestBody ReglaReposicion regla) {
        return reglaService.registrarRegla(regla);
    }

    @PutMapping("/{id}")
    public String editarRegla(@PathVariable int id, @RequestBody ReglaReposicion regla) {
        return reglaService.editarRegla(id, regla);
    }

    @GetMapping
    public List<ReglaReposicion> listarReglas() {
        return reglaService.listarReglas();
    }

    // El frontend muestra el cuerpo de la respuesta (res.text()) como mensaje de error
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> valoresInvalidos(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> reglaDuplicada(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> noEncontrada(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }

    // Respaldo de la restricción única de la tabla (dos peticiones simultáneas) o producto/tienda inexistente
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> integridad(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("No se pudo guardar: la regla ya existe o el producto/tienda no existe.");
    }
}
