// Ruta: backend/src/main/java/com/ey/springboot3security/controller/ProductoController.java
package com.ey.springboot3security.controller;

import com.ey.springboot3security.entity.Producto;
import com.ey.springboot3security.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*") // Permite peticiones desde el frontend local
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    @PostMapping
    public ResponseEntity<?> registrarProducto(@RequestBody Producto producto) {
        // 1. Validación de campos obligatorios
        if (producto.getNombre() == null || producto.getNombre().isBlank() ||
            producto.getIdentificador() == null || producto.getIdentificador().isBlank() ||
            producto.getCategoria() == null || producto.getCategoria().isBlank()) {
            return ResponseEntity.badRequest().body("Error: Nombre, identificador y categoría son obligatorios.");
        }

        // 2. Validación de identificador único en la BD
        if (productoRepository.findByIdentificador(producto.getIdentificador()).isPresent()) {
            return ResponseEntity.status(409).body("Error: El identificador de producto ya está registrado.");
        }

        // 3. Guardar el producto
        return ResponseEntity.status(201).body(productoRepository.save(producto));
    }

    @GetMapping
    public ResponseEntity<List<Producto>> listarProductos() {
        return ResponseEntity.ok(productoRepository.findAll());
    }
}