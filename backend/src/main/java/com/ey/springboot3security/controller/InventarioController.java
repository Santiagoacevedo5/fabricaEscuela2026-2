package com.ey.springboot3security.controller;

import com.ey.springboot3security.entity.CentroDistribucion;
import com.ey.springboot3security.entity.Inventario;
import com.ey.springboot3security.entity.Producto;
import com.ey.springboot3security.entity.Tienda;
import com.ey.springboot3security.repository.CentroDistribucionRepository;
import com.ey.springboot3security.repository.InventarioRepository;
import com.ey.springboot3security.repository.ProductoRepository;
import com.ey.springboot3security.repository.TiendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ey.springboot3security.entity.MovimientoInventario;
import com.ey.springboot3security.repository.MovimientoInventarioRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/inventario")
public class InventarioController {

    private final InventarioRepository inventarioRepository;
    private final ProductoRepository productoRepository;
    private final TiendaRepository tiendaRepository;
    private final CentroDistribucionRepository centroRepository;
    private final MovimientoInventarioRepository movimientoRepository;

    @PostMapping
    public ResponseEntity<?> crearInventario(@RequestBody Inventario inventario) {
        boolean esCd = inventario.getCentroDistribucion() != null;
        boolean esTienda = inventario.getTienda() != null;

        // 1. Validaciones de campos
        if (esCd == esTienda) {
            return ResponseEntity.badRequest().body("Error: Debe indicar un centro de distribución o una tienda (solo uno).");
        }
        if (inventario.getProducto() == null || inventario.getProducto().getIdProducto() == null) {
            return ResponseEntity.badRequest().body("Error: El producto es obligatorio.");
        }
        if (inventario.getCantidad() == null || inventario.getCantidad() < 0) {
            return ResponseEntity.badRequest().body("Error: La cantidad debe ser 0 o mayor.");
        }

        // 2. El producto debe existir
        Producto producto = productoRepository.findById(inventario.getProducto().getIdProducto()).orElse(null);
        if (producto == null) {
            return ResponseEntity.status(404).body("Error: El producto no existe.");
        }
        inventario.setProducto(producto);

        // 3. La ubicación debe existir y no tener ya ese producto
        if (esCd) {
            Integer id = inventario.getCentroDistribucion().getId();
            CentroDistribucion cd = id == null ? null : centroRepository.findById(id).orElse(null);
            if (cd == null) {
                return ResponseEntity.status(404).body("Error: El centro de distribución no existe.");
            }
            if (inventarioRepository.existsByProductoIdProductoAndCentroDistribucionId(producto.getIdProducto(), id)) {
                return ResponseEntity.status(409).body("Error: Este producto ya tiene inventario en el centro de distribución.");
            }
            inventario.setCentroDistribucion(cd);
        } else {
            Integer id = inventario.getTienda().getId();
            Tienda tienda = id == null ? null : tiendaRepository.findById(id).orElse(null);
            if (tienda == null) {
                return ResponseEntity.status(404).body("Error: La tienda no existe.");
            }
            if (inventarioRepository.existsByProductoIdProductoAndTiendaId(producto.getIdProducto(), id)) {
                return ResponseEntity.status(409).body("Error: Este producto ya tiene inventario en la tienda.");
            }
            inventario.setTienda(tienda);
        }

        inventario.setId(null); // evita que un id enviado sobrescriba un registro existente
        return ResponseEntity.status(201).body(inventarioRepository.save(inventario));
    }

    @GetMapping
    public List<Inventario> listarInventario() {
        return inventarioRepository.findAll();
    }

    @PostMapping("/movimientos")
    @Transactional // el movimiento y el cambio de stock se guardan juntos o ninguno
    public ResponseEntity<?> registrarMovimiento(@RequestBody MovimientoInventario movimiento) {
        String tipo = movimiento.getTipo();

        // 1. Validaciones de campos
        if (!"ENTRADA".equals(tipo) && !"SALIDA".equals(tipo)) {
            return ResponseEntity.badRequest().body("Error: El tipo debe ser ENTRADA o SALIDA.");
        }
        if (movimiento.getCantidad() == null || movimiento.getCantidad() <= 0) {
            return ResponseEntity.badRequest().body("Error: La cantidad debe ser mayor a 0.");
        }

        // 2. El inventario debe existir
        Long idInventario = movimiento.getInventario() == null ? null : movimiento.getInventario().getId();
        Inventario inventario = idInventario == null ? null : inventarioRepository.findById(idInventario).orElse(null);
        if (inventario == null) {
            return ResponseEntity.status(404).body("Error: El inventario no existe.");
        }

        // 3. Calcular el nuevo stock; una salida no puede dejarlo negativo
        int nuevaCantidad = "ENTRADA".equals(tipo)
                ? inventario.getCantidad() + movimiento.getCantidad()
                : inventario.getCantidad() - movimiento.getCantidad();
        if (nuevaCantidad < 0) {
            return ResponseEntity.status(409).body("Error: Stock insuficiente. Disponible: " + inventario.getCantidad());
        }

        // 4. Guardar stock y movimiento
        inventario.setCantidad(nuevaCantidad);
        inventarioRepository.save(inventario);
        movimiento.setInventario(inventario);
        movimiento.setId(null);
        return ResponseEntity.status(201).body(movimientoRepository.save(movimiento));
    }

    @GetMapping("/movimientos")
    public List<MovimientoInventario> listarMovimientos() {
        return movimientoRepository.findAll();
    }
}