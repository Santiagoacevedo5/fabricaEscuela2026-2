package com.ey.springboot3security.service;

import com.ey.springboot3security.dto.DemandaProducto;
import com.ey.springboot3security.entity.Tienda;
import com.ey.springboot3security.repository.CentroDistribucionRepository;
import com.ey.springboot3security.repository.MovimientoInventarioRepository;
import com.ey.springboot3security.repository.TiendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// HU5.1: calcula la demanda (unidades vendidas) por tienda y por producto.
@Service
@RequiredArgsConstructor
public class DemandaService {

    private final MovimientoInventarioRepository movimientoRepository;
    private final TiendaRepository tiendaRepository;
    private final CentroDistribucionRepository centroRepository;

    public static boolean esAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    // Tiendas que puede consultar el usuario logueado:
    // admin -> todas; encargado de CD -> las de su CD; cualquier otro -> ninguna.
    // El servidor decide a partir del usuario del token, nunca de lo que mande el frontend.
    public List<Tienda> tiendasVisibles(Authentication auth) {
        if (esAdmin(auth)) {
            return tiendaRepository.findAll();
        }
        return centroRepository.findByEncargado_Username(auth.getName())
                .map(cd -> tiendaRepository.findByCentroDistribucionId(cd.getId()))
                .orElse(List.of());
    }

    // Escenario 1: unidades vendidas por producto en una tienda, de mayor a menor.
    // "hasta" se convierte en el inicio del día siguiente para incluir todas las ventas del último día.
    public List<DemandaProducto> demandaPorTienda(Integer tiendaId, LocalDate desde, LocalDate hasta) {
        return movimientoRepository.demandaPorTienda(tiendaId, inicio(desde), finExclusivo(hasta));
    }

    // Escenario 3: unidades vendidas de un producto en cada tienda visible, de mayor a menor.
    // Las tiendas sin ventas también aparecen, con 0, para que la comparación sea completa.
    public List<Map<String, Object>> compararTiendas(Long productoId, List<Tienda> tiendas,
                                                     LocalDate desde, LocalDate hasta) {
        if (tiendas.isEmpty()) {
            return List.of();
        }
        List<Integer> ids = tiendas.stream().map(Tienda::getId).toList();

        Map<Integer, Long> unidadesPorTienda = new HashMap<>();
        movimientoRepository.demandaProductoPorTienda(productoId, ids, inicio(desde), finExclusivo(hasta))
                .forEach(d -> unidadesPorTienda.put(d.getTiendaId(), d.getUnidades()));

        return tiendas.stream()
                .map(t -> {
                    Map<String, Object> fila = new LinkedHashMap<>();
                    fila.put("tiendaId", t.getId());
                    fila.put("tienda", t.getNombre());
                    fila.put("region", t.getRegion());
                    fila.put("unidades", unidadesPorTienda.getOrDefault(t.getId(), 0L));
                    return fila;
                })
                .sorted(Comparator.comparing((Map<String, Object> f) -> (Long) f.get("unidades")).reversed())
                .toList();
    }

    private static LocalDateTime inicio(LocalDate fecha) {
        return fecha.atStartOfDay();
    }

    private static LocalDateTime finExclusivo(LocalDate fecha) {
        return fecha.plusDays(1).atStartOfDay();
    }
}