package com.ey.springboot3security.controller;

import com.ey.springboot3security.dto.CapacidadRequest;
import com.ey.springboot3security.dto.DespachoRequest;
import com.ey.springboot3security.dto.EntradaRequest;
import com.ey.springboot3security.entity.CentroDistribucion;
import com.ey.springboot3security.entity.Inventario;
import com.ey.springboot3security.entity.Producto;
import com.ey.springboot3security.entity.Tienda;
import com.ey.springboot3security.entity.UserInfo;
import com.ey.springboot3security.repository.CentroDistribucionRepository;
import com.ey.springboot3security.repository.InventarioRepository;
import com.ey.springboot3security.repository.ProductoRepository;
import com.ey.springboot3security.repository.TiendaRepository;
import com.ey.springboot3security.service.CentroDistribucionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.ey.springboot3security.entity.MovimientoInventario;
import com.ey.springboot3security.repository.MovimientoInventarioRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/inventario")
public class InventarioController {

    private static final Logger log = LoggerFactory.getLogger(InventarioController.class);

    private final InventarioRepository inventarioRepository;
    private final ProductoRepository productoRepository;
    private final TiendaRepository tiendaRepository;
    private final CentroDistribucionRepository centroRepository;
    private final MovimientoInventarioRepository movimientoRepository;
    // Se reutiliza para cambiar el estado del CD con las reglas del equipo (HU3.6)
    private final CentroDistribucionService centroDistribucionService;

    // ---------- HUS-02: control de acceso por ubicación ----------

    private static boolean esAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    // El usuario logueado es el encargado asignado a esa ubicación
    private static boolean esEncargadoDe(UserInfo encargado, Authentication auth) {
        return encargado != null && auth.getName().equals(encargado.getUsername());
    }

    // Responde 403 y deja registrado el intento con usuario, fecha y hora (requisito de la HUS-02)
    private ResponseEntity<?> accesoDenegado(Authentication auth, String accion, String ubicacion) {
        log.warn("ACCESO DENEGADO | usuario={} | accion={} | ubicacion={} | fecha={}",
                auth.getName(), accion, ubicacion, LocalDateTime.now());
        return ResponseEntity.status(403).body("Acceso no autorizado: solo puede operar la ubicación que tiene asignada.");
    }

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

    // Endpoint anterior de entradas y salidas: se cerró porque no valida capacidad ni estado.
    // Las entradas van por /entradas y las salidas de un CD son despachos (/despachos).
    @PostMapping("/movimientos")
    public ResponseEntity<?> registrarMovimiento(@RequestBody MovimientoInventario movimiento) {
        return ResponseEntity.status(410).body(
                "Error: Este endpoint ya no se usa. Use /api/inventario/entradas para entradas, "
                        + "/api/inventario/despachos para salidas de un CD y /api/inventario/ventas para ventas.");
    }

    @PostMapping("/ventas")
    @Transactional
    public ResponseEntity<?> registrarVenta(@RequestBody MovimientoInventario movimiento, Authentication auth) {
        if (!"VENTA".equals(movimiento.getTipo())) {
            return ResponseEntity.badRequest().body("Error: El tipo debe ser VENTA.");
        }
        return guardarMovimiento(movimiento, true, auth);
    }

    private ResponseEntity<?> guardarMovimiento(MovimientoInventario movimiento, boolean venta, Authentication auth) {
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
        // HUS-02: el encargado de tienda solo vende en su propia tienda
        if (venta && !esAdmin(auth) && !esEncargadoDe(inventario.getTienda().getEncargado(), auth)) {
            return accesoDenegado(auth, "VENTA", "Tienda " + inventario.getTienda().getId());
        }
        // Una tienda cerrada no puede vender
        if (venta && Boolean.FALSE.equals(inventario.getTienda().getActiva())) {
            return ResponseEntity.status(409).body("Error: La tienda está inactiva. No se pueden registrar ventas.");
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
    public ResponseEntity<?> registrarDespacho(@RequestBody DespachoRequest req, Authentication auth) {
        // 1. Datos obligatorios
        if (req.getInventarioId() == null || req.getTiendaId() == null) {
            return ResponseEntity.badRequest().body("Error: Debe indicar el inventario del CD y la tienda destino.");
        }
        if (req.getCantidad() == null || req.getCantidad() <= 0) {
            return ResponseEntity.badRequest().body("Error: La cantidad debe ser mayor a 0.");
        }

        // 2. El origen debe ser inventario de un CD abierto, y del CD del usuario (HUS-02)
        Inventario origen = inventarioRepository.findById(req.getInventarioId()).orElse(null);
        if (origen == null) {
            return ResponseEntity.status(404).body("Error: El inventario no existe.");
        }
        if (origen.getCentroDistribucion() == null) {
            return ResponseEntity.badRequest().body("Error: Solo se puede despachar desde el inventario de un centro de distribución.");
        }
        if (!esAdmin(auth) && !esEncargadoDe(origen.getCentroDistribucion().getEncargado(), auth)) {
            return accesoDenegado(auth, "DESPACHO", "CD " + origen.getCentroDistribucion().getId());
        }
        if ("INACTIVO".equals(origen.getCentroDistribucion().getEstado())) {
            return ResponseEntity.status(409).body("Error: El centro de distribución está inactivo. No se pueden hacer despachos.");
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

        // 4b. La tienda debe tener su inventario creado y espacio suficiente
        if (tienda.getCapacidadMaxima() == null) {
            return ResponseEntity.status(409).body("Error: La tienda no tiene inventario creado. Primero use \"Crear inventario\".");
        }
        long totalTienda = inventarioRepository.totalEnTienda(tienda.getId());
        if (totalTienda + req.getCantidad() > tienda.getCapacidadMaxima()) {
            long disponible = Math.max(0, tienda.getCapacidadMaxima() - totalTienda);
            return ResponseEntity.status(409).body("Error: El despacho supera la capacidad máxima de la tienda ("
                    + tienda.getCapacidadMaxima() + "). Actualmente tiene " + totalTienda + ", espacio disponible: " + disponible + ".");
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

    // Crear inventario de una ubicación: define su capacidad total (suma de todos los productos).
    // Los productos se agregan después con "Registrar entrada" (CD) o por despacho (tienda).
    @PostMapping("/capacidad")
    public ResponseEntity<?> crearInventarioUbicacion(@RequestBody CapacidadRequest req) {
        Integer min = req.getCapacidadMinima();
        Integer max = req.getCapacidadMaxima();

        // 1. Datos obligatorios y coherentes
        if (req.getUbicacionId() == null) {
            return ResponseEntity.badRequest().body("Error: Debe seleccionar la ubicación.");
        }
        if (min == null || max == null) {
            return ResponseEntity.badRequest().body("Error: La capacidad mínima y la máxima son obligatorias.");
        }
        if (min < 0) {
            return ResponseEntity.badRequest().body("Error: La capacidad mínima no puede ser negativa.");
        }
        if (max <= min) {
            return ResponseEntity.badRequest().body("Error: La capacidad máxima debe ser mayor que la mínima.");
        }

        // 2. Según el tipo, la ubicación debe existir, no tener inventario creado
        //    y el máximo no puede quedar por debajo de lo que ya tiene
        if ("CD".equals(req.getTipo())) {
            CentroDistribucion cd = centroRepository.findById(req.getUbicacionId()).orElse(null);
            if (cd == null) {
                return ResponseEntity.status(404).body("Error: El centro de distribución no existe.");
            }
            if (cd.getCapacidadMaxima() != null) {
                return ResponseEntity.status(409).body("Error: Este centro de distribución ya tiene inventario creado.");
            }
            long total = inventarioRepository.totalEnCentro(cd.getId());
            if (max < total) {
                return ResponseEntity.status(409).body("Error: La capacidad máxima no puede ser menor a las unidades que ya tiene (" + total + ").");
            }
            cd.setCapacidadMinima(min);
            cd.setCapacidadMaxima(max);
            centroRepository.save(cd);
        } else if ("TIENDA".equals(req.getTipo())) {
            Tienda tienda = tiendaRepository.findById(req.getUbicacionId()).orElse(null);
            if (tienda == null) {
                return ResponseEntity.status(404).body("Error: La tienda no existe.");
            }
            if (tienda.getCapacidadMaxima() != null) {
                return ResponseEntity.status(409).body("Error: Esta tienda ya tiene inventario creado.");
            }
            long total = inventarioRepository.totalEnTienda(tienda.getId());
            if (max < total) {
                return ResponseEntity.status(409).body("Error: La capacidad máxima no puede ser menor a las unidades que ya tiene (" + total + ").");
            }
            tienda.setCapacidadMinima(min);
            tienda.setCapacidadMaxima(max);
            tiendaRepository.save(tienda);
        } else {
            return ResponseEntity.badRequest().body("Error: El tipo debe ser CD o TIENDA.");
        }

        return ResponseEntity.status(201).body(Map.of(
                "mensaje", "Inventario creado exitosamente.",
                "capacidadMinima", min,
                "capacidadMaxima", max
        ));
    }

    // Registrar entrada: ingresa unidades de cualquier producto del catálogo a un CD,
    // respetando la capacidad máxima del CD (suma de todos sus productos).
    @PostMapping("/entradas")
    @Transactional
    public ResponseEntity<?> registrarEntrada(@RequestBody EntradaRequest req, Authentication auth) {
        // 1. Datos obligatorios
        if (req.getCentroId() == null || req.getProductoId() == null) {
            return ResponseEntity.badRequest().body("Error: Debe seleccionar el centro de distribución y el producto.");
        }
        if (req.getCantidad() == null || req.getCantidad() <= 0) {
            return ResponseEntity.badRequest().body("Error: La cantidad debe ser mayor a 0.");
        }

        // 2. El CD debe existir, ser del usuario (HUS-02), tener su inventario creado y estar abierto
        CentroDistribucion cd = centroRepository.findById(req.getCentroId()).orElse(null);
        if (cd == null) {
            return ResponseEntity.status(404).body("Error: El centro de distribución no existe.");
        }
        if (!esAdmin(auth) && !esEncargadoDe(cd.getEncargado(), auth)) {
            return accesoDenegado(auth, "ENTRADA", "CD " + cd.getId());
        }
        if (cd.getCapacidadMaxima() == null) {
            return ResponseEntity.status(409).body("Error: Este centro de distribución no tiene inventario creado. Primero use \"Crear inventario\".");
        }
        if ("INACTIVO".equals(cd.getEstado())) {
            return ResponseEntity.status(409).body("Error: El centro de distribución está inactivo. No se pueden registrar entradas.");
        }

        // 3. El producto debe existir
        Producto producto = productoRepository.findById(req.getProductoId()).orElse(null);
        if (producto == null) {
            return ResponseEntity.status(404).body("Error: El producto no existe.");
        }

        // 4. La entrada no puede pasar la capacidad máxima del CD
        long total = inventarioRepository.totalEnCentro(cd.getId());
        if (total + req.getCantidad() > cd.getCapacidadMaxima()) {
            long disponible = Math.max(0, cd.getCapacidadMaxima() - total);
            return ResponseEntity.status(409).body("Error: La entrada supera la capacidad máxima del CD ("
                    + cd.getCapacidadMaxima() + "). Actualmente tiene " + total + ", espacio disponible: " + disponible + ".");
        }

        // 5. Fila del producto en el CD (si nunca lo ha tenido, se crea en 0)
        Inventario fila = inventarioRepository
                .findByProductoIdProductoAndCentroDistribucionId(producto.getIdProducto(), cd.getId())
                .orElseGet(() -> {
                    Inventario nuevo = new Inventario();
                    nuevo.setCentroDistribucion(cd);
                    nuevo.setProducto(producto);
                    nuevo.setCantidad(0);
                    return nuevo;
                });
        int actual = fila.getCantidad() == null ? 0 : fila.getCantidad();
        fila.setCantidad(actual + req.getCantidad());
        fila = inventarioRepository.save(fila);

        // 6. Trazabilidad
        MovimientoInventario movimiento = new MovimientoInventario();
        movimiento.setInventario(fila);
        movimiento.setTipo("ENTRADA");
        movimiento.setCantidad(req.getCantidad());
        return ResponseEntity.status(201).body(movimientoRepository.save(movimiento));
    }

    // Editar inventario de una ubicación: cambia su capacidad y la abre o cierra.
    // Cerrar el inventario es cerrar la ubicación (estado del CD / activa de la tienda).
    @PutMapping("/capacidad")
    @Transactional
    public ResponseEntity<?> editarInventarioUbicacion(@RequestBody CapacidadRequest req) {
        Integer min = req.getCapacidadMinima();
        Integer max = req.getCapacidadMaxima();

        // 1. Datos obligatorios y coherentes (igual que al crear)
        if (req.getUbicacionId() == null) {
            return ResponseEntity.badRequest().body("Error: Debe seleccionar la ubicación.");
        }
        if (min == null || max == null) {
            return ResponseEntity.badRequest().body("Error: La capacidad mínima y la máxima son obligatorias.");
        }
        if (min < 0) {
            return ResponseEntity.badRequest().body("Error: La capacidad mínima no puede ser negativa.");
        }
        if (max <= min) {
            return ResponseEntity.badRequest().body("Error: La capacidad máxima debe ser mayor que la mínima.");
        }

        if ("CD".equals(req.getTipo())) {
            CentroDistribucion cd = centroRepository.findById(req.getUbicacionId()).orElse(null);
            if (cd == null) {
                return ResponseEntity.status(404).body("Error: El centro de distribución no existe.");
            }
            if (cd.getCapacidadMaxima() == null) {
                return ResponseEntity.status(409).body("Error: Este centro de distribución no tiene inventario creado. Use \"Crear inventario\".");
            }
            long total = inventarioRepository.totalEnCentro(cd.getId());
            if (max < total) {
                return ResponseEntity.status(409).body("Error: La capacidad máxima no puede ser menor a las unidades que ya tiene (" + total + ").");
            }
            cd.setCapacidadMinima(min);
            cd.setCapacidadMaxima(max);
            centroRepository.save(cd);

            // El estado se cambia con el método del equipo, que además quita el encargado al cerrar
            if (req.getActivo() != null) {
                String nuevoEstado = req.getActivo() ? "ACTIVO" : "INACTIVO";
                if (!nuevoEstado.equals(cd.getEstado())) {
                    CentroDistribucion cambio = new CentroDistribucion();
                    cambio.setEstado(nuevoEstado);
                    centroDistribucionService.actualizarEstado(cd.getId(), cambio);
                }
            }
        } else if ("TIENDA".equals(req.getTipo())) {
            Tienda tienda = tiendaRepository.findById(req.getUbicacionId()).orElse(null);
            if (tienda == null) {
                return ResponseEntity.status(404).body("Error: La tienda no existe.");
            }
            if (tienda.getCapacidadMaxima() == null) {
                return ResponseEntity.status(409).body("Error: Esta tienda no tiene inventario creado. Use \"Crear inventario\".");
            }
            long total = inventarioRepository.totalEnTienda(tienda.getId());
            if (max < total) {
                return ResponseEntity.status(409).body("Error: La capacidad máxima no puede ser menor a las unidades que ya tiene (" + total + ").");
            }
            tienda.setCapacidadMinima(min);
            tienda.setCapacidadMaxima(max);
            if (req.getActivo() != null) {
                tienda.setActiva(req.getActivo());
            }
            tiendaRepository.save(tienda);
        } else {
            return ResponseEntity.badRequest().body("Error: El tipo debe ser CD o TIENDA.");
        }

        return ResponseEntity.ok(Map.of(
                "mensaje", "Inventario actualizado exitosamente.",
                "capacidadMinima", min,
                "capacidadMaxima", max
        ));
    }

    // HUS-02 "Mi inventario": el encargado consulta solo la ubicación que tiene asignada.
    // El servidor decide qué ubicación es a partir del usuario del token.
    @GetMapping("/mio")
    public ResponseEntity<?> miInventario(Authentication auth) {
        String usuario = auth.getName();

        CentroDistribucion cd = centroRepository.findByEncargado_Username(usuario).orElse(null);
        if (cd != null) {
            return ResponseEntity.ok(resumenUbicacion(
                    "CD", cd.getNombre(), cd.getCapacidadMinima(), cd.getCapacidadMaxima(),
                    !"INACTIVO".equals(cd.getEstado()),
                    inventarioRepository.findByCentroDistribucionId(cd.getId())));
        }

        Tienda tienda = tiendaRepository.findByEncargado_Username(usuario).orElse(null);
        if (tienda != null) {
            return ResponseEntity.ok(resumenUbicacion(
                    "TIENDA", tienda.getNombre(), tienda.getCapacidadMinima(), tienda.getCapacidadMaxima(),
                    !Boolean.FALSE.equals(tienda.getActiva()),
                    inventarioRepository.findByTiendaId(tienda.getId())));
        }

        return ResponseEntity.status(404).body("No tiene un centro de distribución ni una tienda asignada.");
    }

    // Arma la respuesta de "Mi inventario". Se usa LinkedHashMap porque la capacidad puede
    // venir vacía (inventario aún no creado) y Map.of no acepta valores null.
    private Map<String, Object> resumenUbicacion(String tipo, String nombre, Integer minimo, Integer maximo,
                                                 boolean activa, List<Inventario> filas) {
        List<Map<String, Object>> productos = filas.stream().map(inv -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("identificador", inv.getProducto().getIdentificador());
            p.put("nombre", inv.getProducto().getNombre());
            p.put("categoria", inv.getProducto().getCategoria());
            p.put("cantidad", inv.getCantidad());
            return p;
        }).toList();

        int ocupacion = filas.stream().mapToInt(inv -> inv.getCantidad() == null ? 0 : inv.getCantidad()).sum();

        Map<String, Object> resumen = new LinkedHashMap<>();
        resumen.put("tipo", tipo);
        resumen.put("nombre", nombre);
        resumen.put("capacidadMinima", minimo);
        resumen.put("capacidadMaxima", maximo);
        resumen.put("ocupacion", ocupacion);
        resumen.put("activa", activa);
        resumen.put("productos", productos);
        return resumen;
    }
}