package com.ey.springboot3security.service;

import com.ey.springboot3security.dto.OrdenActivaReposicionData;
import com.ey.springboot3security.dto.RecomendacionBase;
import com.ey.springboot3security.dto.RecomendacionReposicionResponse;
import com.ey.springboot3security.repository.OrdenItemRepository;
import com.ey.springboot3security.repository.ReglaReposicionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReabastecimientoService {
    private static final List<String> ORDENES_ACTIVAS = List.of("Pendiente", "Aprobada", "Enviada");
    private static final List<String> ORDENES_QUE_RESERVAN_STOCK = List.of("Pendiente", "Aprobada");

    private final ReglaReposicionRepository reglaRepository;
    private final OrdenItemRepository ordenItemRepository;

    public ReabastecimientoService(ReglaReposicionRepository reglaRepository,
                                   OrdenItemRepository ordenItemRepository) {
        this.reglaRepository = reglaRepository;
        this.ordenItemRepository = ordenItemRepository;
    }

    @Transactional(readOnly = true)
    public List<RecomendacionReposicionResponse> listarRecomendaciones(Integer centroId) {
        List<RecomendacionBase> bases = reglaRepository.findRecomendacionesActivas(centroId);
        if (bases.isEmpty()) {
            return List.of();
        }

        List<OrdenActivaReposicionData> ordenes =
                ordenItemRepository.findOrdenesActivas(centroId, ORDENES_ACTIVAS);
        Map<Long, Long> reservadoPorProducto = new HashMap<>();
        for (OrdenActivaReposicionData orden : ordenes) {
            if (ORDENES_QUE_RESERVAN_STOCK.contains(orden.estado())) {
                reservadoPorProducto.merge(orden.productoId(), orden.cantidad().longValue(), Long::sum);
            }
        }

        return bases.stream().map(base -> {
            long disponible = Math.max(0L, base.stockCentro().longValue()
                    - reservadoPorProducto.getOrDefault(base.productoId(), 0L));
            int cantidadSugerida = (int) Math.min(base.cantidadReposicion(), disponible);
            return new RecomendacionReposicionResponse(
                    base.reglaId(),
                    base.productoId(),
                    base.producto(),
                    base.identificador(),
                    base.tiendaId(),
                    base.tienda(),
                    base.region(),
                    base.stockActual(),
                    base.umbralMinimo(),
                    cantidadSugerida,
                    cantidadSugerida < base.cantidadReposicion());
        }).toList();
    }
}
