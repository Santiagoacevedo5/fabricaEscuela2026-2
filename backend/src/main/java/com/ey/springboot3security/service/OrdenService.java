package com.ey.springboot3security.service;

import com.ey.springboot3security.dto.OrdenActivaReposicionData;
import com.ey.springboot3security.dto.OrdenRequest;
import com.ey.springboot3security.entity.*;
import com.ey.springboot3security.repository.*;
import com.ey.springboot3security.dto.OrdenResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class OrdenService {
    private static final List<String> ESTADOS_QUE_RESERVAN_STOCK = List.of("Pendiente", "Aprobada");

    private final CentroDistribucionRepository centroRepository;
    private final TiendaRepository tiendaRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final OrdenReabastecimientoRepository ordenRepository;
    private final OrdenItemRepository ordenItemRepository;

    public OrdenService(CentroDistribucionRepository centroRepository,
                        TiendaRepository tiendaRepository,
                        ProductoRepository productoRepository,
                        InventarioRepository inventarioRepository,
                        OrdenReabastecimientoRepository ordenRepository,
                        OrdenItemRepository ordenItemRepository){

        this.centroRepository = centroRepository;
        this.tiendaRepository = tiendaRepository;
        this.productoRepository = productoRepository;
        this.inventarioRepository = inventarioRepository;
        this.ordenRepository = ordenRepository;
        this.ordenItemRepository = ordenItemRepository;
    }


    @Transactional
    public OrdenReabastecimiento crearOrden(OrdenRequest request, String username){
        Optional<CentroDistribucion> centroOpt = centroRepository.findByEncargado_Username(username);
        if (centroOpt.isEmpty() && !esAdmin()){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No tienes un centro de distribución asignado");
        }
        CentroDistribucion centro = centroOpt.orElse(null);

        if(request.getTiendaId() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes seleccionar una tienda");
        }

        if(request.getItems() == null || request.getItems().isEmpty()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La orden debe tener al menos un producto");
        }

        Optional<Tienda> tiendaOpt = tiendaRepository.findById(request.getTiendaId());
        if (tiendaOpt.isEmpty()){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La tienda digitada no existe");
        }
        Tienda tienda = tiendaOpt.get();

        if(Boolean.FALSE.equals(tienda.getActiva())){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La tienda digitada está inactiva");
        }

        if (tienda.getCentroDistribucion() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La tienda no tiene un centro de distribución asignado");
        }

        if (esAdmin()){
            centro = tienda.getCentroDistribucion();
        }

        if (!centro.getId().equals(tienda.getCentroDistribucion().getId())){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La tienda digitada tiene asignado otro centro de distribución");
        }

        Set<Long> productosVistos = new HashSet<>();
        List<OrdenItem> lineas = new ArrayList<>();
        List<OrdenRequest.Item> itemsOrdenados = new ArrayList<>(request.getItems());

        itemsOrdenados.sort(Comparator.nullsLast(Comparator.comparing(OrdenRequest.Item::getProductoId,
                                                                        Comparator.nullsLast(Comparator.naturalOrder()))
        ));

        for (OrdenRequest.Item item : itemsOrdenados){
            if (item == null || item.getProductoId() == null){
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cada línea debe tener un producto");
            }

            if (item.getCantidad() == null || item.getCantidad() <= 0){
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor que 0");
            }

            if (!productosVistos.add(item.getProductoId())){
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hay un producto repetido en la orden");
            }

            Optional<Producto> productoOpt = productoRepository.findById(item.getProductoId());
            if (productoOpt.isEmpty()){
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El producto digitado no existe");
            }

            Producto producto = productoOpt.get();

            if (!producto.isActivo()){
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El producto " + producto.getNombre() + " está inactivo");
            }

            Optional<Inventario> inventarioOpt = inventarioRepository.findByProductoYCentroForUpdate(item.getProductoId(), centro.getId());

            if (inventarioOpt.isEmpty()){
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El producto " + producto.getNombre() + " no está en el inventario de tu centro");
            }

            int stockCd = inventarioOpt.get().getCantidad() == null ? 0 : inventarioOpt.get().getCantidad();

            List<OrdenActivaReposicionData> reservas =
                    ordenItemRepository.findOrdenesActivas(centro.getId(), ESTADOS_QUE_RESERVAN_STOCK);

            int reservado = reservas.stream()
                    .filter(r -> r.productoId().equals(item.getProductoId()))
                    .mapToInt(r -> r.cantidad())
                    .sum();

            int disponible = stockCd - reservado;

            if (item.getCantidad() > disponible){
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "La cantidad solicitada (" + item.getCantidad() + ") supera el stock disponible ("
                         + disponible + ") de " + productoOpt.get().getNombre());
            }

            OrdenItem linea = new OrdenItem();
            linea.setProducto(productoOpt.get());
            linea.setCantidad(item.getCantidad());
            lineas.add(linea);
        }

        OrdenReabastecimiento orden = new OrdenReabastecimiento();
        orden.setTienda(tienda);
        orden.setEstado("Pendiente");
        orden = ordenRepository.save(orden);

        for (OrdenItem linea : lineas){
            linea.setOrden(orden);
        }
        ordenItemRepository.saveAll(lineas);

        return orden;
    }

    @Transactional(readOnly = true)
    public List<OrdenReabastecimiento> listarOrdenes(String username){
        Optional<CentroDistribucion> centroOpt = centroRepository.findByEncargado_Username(username);

        if(esAdmin()){
            return ordenRepository.findAll();
        }

        if (centroOpt.isEmpty()){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No tienes un centro de distribución asignado");
        }
        CentroDistribucion centro = centroOpt.get();

        return ordenRepository.findByTienda_CentroDistribucion_Id(centro.getId());
    }

    @Transactional(readOnly = true)
    public OrdenReabastecimiento obtenerOrden(Long id, String username){
        return obtenerOrden(id, username, false);
    }

    private OrdenReabastecimiento obtenerOrden(Long id, String username, boolean bloquear){
        Optional<CentroDistribucion> centroOpt =
                centroRepository.findByEncargado_Username(username);

        if(centroOpt.isEmpty() && !esAdmin()){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No tienes un centro de distribución asignado");
        }

        CentroDistribucion centro = centroOpt.orElse(null);

        Optional<OrdenReabastecimiento> ordenOpt = bloquear
                ? ordenRepository.findByIdForUpdate(id)
                : ordenRepository.findById(id);

        if (ordenOpt.isEmpty()){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La orden digitada no existe");
        }

        OrdenReabastecimiento orden = ordenOpt.get();

        if(!esAdmin() && (centro == null ||
                orden.getTienda().getCentroDistribucion() == null ||
                !Objects.equals(
                        orden.getTienda().getCentroDistribucion().getId(),
                        centro.getId()))){

            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La orden no pertenece a tu centro de distribución");
        }

        return orden;
    }

    @Transactional
    public OrdenReabastecimiento aprobarOrden(Long id, String username){
        OrdenReabastecimiento orden = obtenerOrden(id, username, true);

        if(!"Pendiente".equals(orden.getEstado())){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La orden ya fue procesada");
        }

        orden.setEstado("Aprobada");
        orden.setRevisadoPor(username);
        orden.setFechaRevision(LocalDateTime.now());

        return ordenRepository.save(orden);
    }

    @Transactional
    public OrdenReabastecimiento rechazarOrden(Long id, String motivo, String username){
        OrdenReabastecimiento orden = obtenerOrden(id, username, true);

        if(!"Pendiente".equals(orden.getEstado())){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La orden ya fue procesada");
        }

        if(motivo == null || motivo.isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes ingresar un motivo de rechazo");
        }

        if (motivo.length() > 500){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El motivo no puede superar los 500 caracteres");
        }

        orden.setEstado("Rechazada");
        orden.setMotivoRechazo(motivo.trim());
        orden.setRevisadoPor(username);
        orden.setFechaRevision(LocalDateTime.now());

        return ordenRepository.save(orden);
    }

    @Transactional(readOnly = true)
    public List<OrdenResponse> listarOrdenesResponse(String username){

        return listarOrdenes(username)
                .stream()
                .map(this::convertirOrden)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrdenResponse obtenerOrdenResponse(Long id, String username){

        return convertirOrden(obtenerOrden(id, username));
    }

    private OrdenResponse convertirOrden(OrdenReabastecimiento orden){

        OrdenResponse response = new OrdenResponse();

        response.setId(orden.getId());
        response.setEstado(orden.getEstado());
        response.setFechaCreacion(orden.getFechaCreacion());
        response.setFechaRevision(orden.getFechaRevision());
        response.setRevisadoPor(orden.getRevisadoPor());
        response.setMotivoRechazo(orden.getMotivoRechazo());

        response.setTiendaId(orden.getTienda().getId().longValue());
        response.setTiendaNombre(orden.getTienda().getNombre());

        CentroDistribucion centro = orden.getTienda().getCentroDistribucion();

        if (orden.getTienda().getEncargado() != null){

            response.setEncargadoTiendaNombre(
                    orden.getTienda().getEncargado().getName());

            response.setEncargadoTiendaUsername(
                    orden.getTienda().getEncargado().getUsername());
        }

        if (centro != null){
            response.setCentroId(centro.getId());
            response.setCentroNombre(centro.getNombre());

            if (centro.getEncargado() != null){

                response.setEncargadoCentroNombre(
                        centro.getEncargado().getName());

                response.setEncargadoCentroUsername(
                        centro.getEncargado().getUsername());
            }
        }

        List<OrdenItem> lineas =
                ordenItemRepository.findByOrden_Id(orden.getId());

        List<OrdenResponse.Item> items = new ArrayList<>();

        for (OrdenItem linea : lineas){

            OrdenResponse.Item item = new OrdenResponse.Item();

            item.setProductoId(linea.getProducto().getIdProducto());
            item.setProductoNombre(linea.getProducto().getNombre());
            item.setCantidad(linea.getCantidad());

            items.add(item);
        }

        response.setItems(items);

        return response;
    }

    private boolean esAdmin(){

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        return authentication != null &&
                authentication.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

}
