package com.ey.springboot3security.controller;

import com.ey.springboot3security.dto.DespachoRequest;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
        if ("VENTA".equals(movimiento.getTipo())) {
            return ResponseEntity.badRequest().body("Error: Use el endpoint de ventas para registrar una venta.");
        }
        return guardarMovimiento(movimiento, false);
    }

    @PostMapping("/ventas")
    @Transactional
    public ResponseEntity<?> registrarVenta(@RequestBody MovimientoInventario movimiento) {
        if (!"VENTA".equals(movimiento.getTipo())) {
            return ResponseEntity.badRequest().body("Error: El tipo debe ser VENTA.");
        }
        return guardarMovimiento(movimiento, true);
    }

    private ResponseEntity<?> guardarMovimiento(MovimientoInventario movimiento, boolean venta) {
        String tipo = movimiento.getTipo();
        if (!venta && !"ENTRADA".equals(tipo) && !"SALIDA".equals(tipo)) {
            return ResponseEntity.badRequest().body("Error: El tipo debe ser ENTRADA o SALIDA.");
        }
        if (movimiento.getCantidad() == null || movimiento.getCantidad() <= 0) {
            return ResponseEntity.badRequest().body("Error: La cantidad debe ser mayor a 0.");
        }
        if (venta && movimiento.getFecha() != null && movimiento.getFecha().isAfter(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Error: La fecha de la venta no puede ser futura.");
        }

        Long idInventario = movimiento.getInventario() == null ? null : movimiento.getInventario().getId();
        Inventario inventario = idInventario == null ? null : inventarioRepository.findById(idInventario).orElse(null);
        if (inventario == null) {
            return ResponseEntity.status(404).body("Error: El inventario no existe.");
        }
        if (venta && inventario.getTienda() == null) {
            return ResponseEntity.badRequest().body("Error: Las ventas solo se pueden registrar en una tienda.");
        }

        long nuevaCantidad = "ENTRADA".equals(tipo)
                ? (long) inventario.getCantidad() + movimiento.getCantidad()
                : (long) inventario.getCantidad() - movimiento.getCantidad();
        if (nuevaCantidad < 0) {
            return ResponseEntity.status(409).body("Error: Stock insuficiente. Disponible: " + inventario.getCantidad());
        }
        if (nuevaCantidad > Integer.MAX_VALUE) {
            return ResponseEntity.status(409).body("Error: La cantidad excede el máximo permitido.");
        }

        inventario.setCantidad((int) nuevaCantidad);
        inventarioRepository.save(inventario);
        movimiento.setInventario(inventario);
        movimiento.setId(null);
        return ResponseEntity.status(201).body(movimientoRepository.save(movimiento));
    }

    @GetMapping("/movimientos")
    public List<MovimientoInventario> listarMovimientos() {
        return movimientoRepository.findAll();
    }

    // Despacho: mueve unidades del inventario de un CD al de una de sus tiendas.
    // Primero se valida todo y solo al final se modifica el stock, porque un return de error
    // no deshace lo que ya se haya guardado (solo una excepción hace rollback).
    @PostMapping("/despachos")
    @Transactional
    public ResponseEntity<?> registrarDespacho(@RequestBody DespachoRequest req) {
        // 1. Datos obligatorios
        if (req.getInventarioId() == null || req.getTiendaId() == null) {
            return ResponseEntity.badRequest().body("Error: Debe indicar el inventario del CD y la tienda destino.");
        }
        if (req.getCantidad() == null || req.getCantidad() <= 0) {
            return ResponseEntity.badRequest().body("Error: La cantidad debe ser mayor a 0.");
        }

        // 2. El origen debe ser inventario de un CD
        Inventario origen = inventarioRepository.findById(req.getInventarioId()).orElse(null);
        if (origen == null) {
            return ResponseEntity.status(404).body("Error: El inventario no existe.");
        }
        if (origen.getCentroDistribucion() == null) {
            return ResponseEntity.badRequest().body("Error: Solo se puede despachar desde el inventario de un centro de distribución.");
        }

        // 3. La tienda debe existir, estar activa y pertenecer a ese CD
        Tienda tienda = tiendaRepository.findById(req.getTiendaId()).orElse(null);
        if (tienda == null) {
            return ResponseEntity.status(404).body("Error: La tienda no existe.");
        }
        if (Boolean.FALSE.equals(tienda.getActiva())) {
            return ResponseEntity.badRequest().body("Error: La tienda está inactiva.");
        }
        Integer cdOrigenId = origen.getCentroDistribucion().getId();
        if (tienda.getCentroDistribucion() == null || !cdOrigenId.equals(tienda.getCentroDistribucion().getId())) {
            return ResponseEntity.badRequest().body("Error: La tienda no pertenece a este centro de distribución.");
        }

        // 4. Stock suficiente en el CD
        if (origen.getCantidad() < req.getCantidad()) {
            return ResponseEntity.status(409).body("Error: Stock insuficiente en el CD. Disponible: " + origen.getCantidad());
        }

        // 5. Fila del producto en la tienda (si nunca lo ha tenido, se crea en 0)
        Inventario destino = inventarioRepository
                .findByProductoIdProductoAndTiendaId(origen.getProducto().getIdProducto(), tienda.getId())
                .orElseGet(() -> {
                    Inventario nuevo = new Inventario();
                    nuevo.setTienda(tienda);
                    nuevo.setProducto(origen.getProducto());
                    nuevo.setCantidad(0);
                    return nuevo;
                });
        int cantidadDestino = destino.getCantidad() == null ? 0 : destino.getCantidad();
        if ((long) cantidadDestino + req.getCantidad() > Integer.MAX_VALUE) {
            return ResponseEntity.status(409).body("Error: La cantidad excede el máximo permitido en la tienda.");
        }

        // 6. Todo validado: ahora sí se mueve el stock
        origen.setCantidad(origen.getCantidad() - req.getCantidad());
        inventarioRepository.save(origen);
        destino.setCantidad(cantidadDestino + req.getCantidad());
        destino = inventarioRepository.save(destino);

        // 7. Trazabilidad: salida en el CD y entrada en la tienda
        MovimientoInventario salida = new MovimientoInventario();
        salida.setInventario(origen);
        salida.setTipo("SALIDA");
        salida.setCantidad(req.getCantidad());

        MovimientoInventario entrada = new MovimientoInventario();
        entrada.setInventario(destino);
        entrada.setTipo("ENTRADA");
        entrada.setCantidad(req.getCantidad());

        return ResponseEntity.status(201).body(Map.of(
                "salida", movimientoRepository.save(salida),
                "entrada", movimientoRepository.save(entrada)
        ));
    }
}