package com.ey.springboot3security.service;

import com.ey.springboot3security.entity.Producto;
import com.ey.springboot3security.repository.InventarioRepository;
import com.ey.springboot3security.repository.MovimientoInventarioRepository;
import com.ey.springboot3security.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// HU8.1: reporte de rotación de productos (solo admin).
@Service
@RequiredArgsConstructor
public class ReporteService {

    private final MovimientoInventarioRepository movimientoRepository;
    private final InventarioRepository inventarioRepository;
    private final ProductoRepository productoRepository;

    // Fórmula de rotación = unidades vendidas / inventario promedio del periodo.
    // Inventario promedio = (inicial + final) / 2, con final = stock actual e inicial ~ stock actual + vendidas,
    // es decir: promedio = stock + vendidas / 2.
    // shortcut: ignora entradas y despachos del periodo, usar un histórico de stock si se requiere precisión.
    public static double calcularRotacion(long vendidas, long stock) {
        if (vendidas <= 0) {
            return 0;
        }
        double rotacion = vendidas / (stock + vendidas / 2.0);
        return Math.round(rotacion * 100) / 100.0;
    }

    // Escenarios 1 y 2: productos activos (y los inactivos que tuvieron ventas), de mayor a menor rotación.
    // Un producto sin ventas en el periodo queda marcado con sinRotacion = true.
    public List<Map<String, Object>> rotacion(Integer tiendaId, LocalDate desde, LocalDate hasta) {
        // "hasta" se convierte en el inicio del día siguiente para incluir todas las ventas del último día
        Map<Long, Long> vendidas = aMapa(movimientoRepository.ventasPorProducto(
                tiendaId, desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay()));
        Map<Long, Long> stock = aMapa(inventarioRepository.stockTiendasPorProducto(tiendaId));

        return productoRepository.findAll().stream()
                .filter(p -> p.isActivo() || vendidas.containsKey(p.getIdProducto()))
                .map(p -> fila(p, vendidas.getOrDefault(p.getIdProducto(), 0L), stock.getOrDefault(p.getIdProducto(), 0L)))
                .sorted(Comparator.comparing((Map<String, Object> f) -> (Double) f.get("rotacion"))
                        .thenComparing(f -> (Long) f.get("unidades"))
                        .reversed())
                .toList();
    }

    private static Map<String, Object> fila(Producto p, long unidades, long stock) {
        Map<String, Object> fila = new LinkedHashMap<>();
        fila.put("idProducto", p.getIdProducto());
        fila.put("identificador", p.getIdentificador());
        fila.put("nombre", p.getNombre());
        fila.put("categoria", p.getCategoria());
        fila.put("unidades", unidades);
        fila.put("stock", stock);
        fila.put("rotacion", calcularRotacion(unidades, stock));
        fila.put("sinRotacion", unidades == 0);
        return fila;
    }

    private static Map<Long, Long> aMapa(List<Object[]> filas) {
        Map<Long, Long> mapa = new HashMap<>();
        filas.forEach(f -> mapa.put((Long) f[0], ((Number) f[1]).longValue()));
        return mapa;
    }
}
