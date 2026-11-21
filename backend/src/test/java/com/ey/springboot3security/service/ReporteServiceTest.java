package com.ey.springboot3security.service;

import com.ey.springboot3security.entity.Producto;
import com.ey.springboot3security.repository.InventarioRepository;
import com.ey.springboot3security.repository.MovimientoInventarioRepository;
import com.ey.springboot3security.repository.ProductoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {

    @Mock
    private MovimientoInventarioRepository movimientoRepository;
    @Mock
    private InventarioRepository inventarioRepository;
    @Mock
    private ProductoRepository productoRepository;
    @InjectMocks
    private ReporteService service;

    @Test
    void formulaDeRotacion() {
        assertEquals(0, ReporteService.calcularRotacion(0, 50));
        assertEquals(2, ReporteService.calcularRotacion(10, 0));   // se vendió todo: 10 / (0 + 5)
        assertEquals(0.67, ReporteService.calcularRotacion(10, 10)); // 10 / (10 + 5)
    }

    @Test
    void ordenaDeMayorAMenorYMarcaSinRotacion() {
        when(movimientoRepository.ventasPorProducto(isNull(), any(), any()))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 5L}, new Object[]{2L, 20L}));
        when(inventarioRepository.stockTiendasPorProducto(null))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 50L}, new Object[]{2L, 10L}, new Object[]{3L, 8L}));
        when(productoRepository.findAll()).thenReturn(List.of(producto(1L), producto(2L), producto(3L)));

        var filas = service.rotacion(null, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30));

        assertEquals(List.of(2L, 1L, 3L), filas.stream().map(f -> f.get("idProducto")).toList());
        assertEquals(true, filas.get(2).get("sinRotacion"));
        assertEquals(0L, filas.get(2).get("unidades"));
    }

    private static Producto producto(Long id) {
        Producto p = new Producto();
        p.setIdProducto(id);
        p.setIdentificador("P" + id);
        p.setNombre("Producto " + id);
        p.setCategoria("General");
        return p;
    }
}
