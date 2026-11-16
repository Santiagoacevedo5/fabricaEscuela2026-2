package com.ey.springboot3security.service;

import com.ey.springboot3security.dto.OrdenActivaReposicionData;
import com.ey.springboot3security.dto.RecomendacionBase;
import com.ey.springboot3security.repository.OrdenItemRepository;
import com.ey.springboot3security.repository.ReglaReposicionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReabastecimientoServiceTest {
    private static final List<String> ORDENES_ACTIVAS = List.of("Pendiente", "Aprobada", "Enviada");

    @Mock
    private ReglaReposicionRepository reglaRepository;
    @Mock
    private OrdenItemRepository ordenItemRepository;

    private ReabastecimientoService service;

    @BeforeEach
    void setUp() {
        service = new ReabastecimientoService(reglaRepository, ordenItemRepository);
    }

    @Test
    void limitaLaRecomendacionAlStockDelCentroYLaMarcaParcial() {
        when(reglaRepository.findRecomendacionesActivas(3))
                .thenReturn(List.of(base(1L, 2, 4, 5, 4, 18)));
        when(ordenItemRepository.findOrdenesActivas(3, ORDENES_ACTIVAS)).thenReturn(List.of());

        var recomendacion = service.listarRecomendaciones(3).getFirst();

        assertEquals(4, recomendacion.stockActual());
        assertEquals(4, recomendacion.cantidadSugerida());
        assertTrue(recomendacion.parcial());
    }

    @Test
    void restaOrdenesPendientesDelStockDisponibleDelCentro() {
        when(reglaRepository.findRecomendacionesActivas(3))
                .thenReturn(List.of(base(1L, 2, 4, 5, 20, 18)));
        when(ordenItemRepository.findOrdenesActivas(3, ORDENES_ACTIVAS))
                .thenReturn(List.of(
                        new OrdenActivaReposicionData(1L, 6, "Pendiente"),
                        new OrdenActivaReposicionData(1L, 3, "Aprobada"),
                        new OrdenActivaReposicionData(1L, 5, "Enviada")));

        var recomendacion = service.listarRecomendaciones(3).getFirst();

        assertEquals(11, recomendacion.cantidadSugerida());
        assertTrue(recomendacion.parcial());
    }

    @Test
    void noDevuelveRecomendacionesCuandoNingunaReglaCumpleElUmbral() {
        when(reglaRepository.findRecomendacionesActivas(3)).thenReturn(List.of());

        assertTrue(service.listarRecomendaciones(3).isEmpty());
        verify(ordenItemRepository, never()).findOrdenesActivas(any(), any());
    }

    private RecomendacionBase base(Long productoId, Integer tiendaId, Integer stockActual,
                                   Integer umbral, Integer stockCentro, Integer cantidadReposicion) {
        return new RecomendacionBase(
                7, productoId, "Camiseta", "SKU-1", tiendaId, "Tienda", "Medellín",
                stockActual, umbral, stockCentro, cantidadReposicion);
    }
}
