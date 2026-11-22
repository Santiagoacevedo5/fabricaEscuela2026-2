package com.ey.springboot3security.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// HU8.2: reporte de niveles de inventario por tienda y centro de distribucion (solo admin, ver SecurityConfig)
@Service
public class ReporteInventarioService {

    // Si una tienda no tiene regla de reposicion activa (o es un CD), se usa este umbral
    private static final int UMBRAL_POR_DEFECTO = 10;

    private final JdbcTemplate jdbc;

    public ReporteInventarioService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Ubicacion(String tipo, Integer id, String nombre) {
    }

    public record FilaInventario(String tipo, Integer ubicacionId, String ubicacion, Long productoId,
                                 String producto, String identificador, int cantidad, int umbral, String estado) {
    }

    // Escenario 2: alertas de stock
    public static String calcularEstado(int cantidad, int umbral) {
        if (cantidad <= 0) {
            return "Sin existencias";
        }
        return cantidad < umbral ? "Bajo stock" : "Disponible";
    }

    @Transactional(readOnly = true)
    public List<Ubicacion> ubicaciones() {
        return jdbc.query(
                "select 'TIENDA' as tipo, id, nombre from tienda "
                        + "union all select 'CD', id, nombre from centro_distribucion "
                        + "order by 1, 3",
                (rs, n) -> new Ubicacion(rs.getString("tipo"), rs.getInt("id"), rs.getString("nombre")));
    }

    // Escenario 1: cada producto con su cantidad disponible por ubicacion.
    // tipo = TIENDA | CD | null (todas); ubicacionId = null para todas las del tipo.
    @Transactional(readOnly = true)
    public List<FilaInventario> generar(String tipo, Integer ubicacionId) {
        String sql = "select * from ("
                + " select 'Tienda' as tipo, t.id as ubicacion_id, t.nombre as ubicacion,"
                + "        p.id_producto, p.nombre as producto, p.identificador, i.cantidad,"
                + "        coalesce((select r.umbral_minimo from reglas_reposicion r"
                + "                  where r.tienda_id = i.tienda_id and r.producto_id = i.producto_id"
                + "                    and r.activa is not false limit 1), ?) as umbral"
                + " from inventario i"
                + " join tienda t on t.id = i.tienda_id"
                + " join producto p on p.id_producto = i.producto_id"
                + " union all"
                + " select 'Centro de distribución', c.id, c.nombre,"
                + "        p.id_producto, p.nombre, p.identificador, i.cantidad, ?"
                + " from inventario i"
                + " join centro_distribucion c on c.id = i.centro_distribucion_id"
                + " join producto p on p.id_producto = i.producto_id"
                + ") v where (?::text is null or v.tipo = ?)"
                + "   and (?::int is null or v.ubicacion_id = ?)"
                + " order by v.tipo, v.ubicacion, v.producto";

        String tipoTexto = "TIENDA".equalsIgnoreCase(tipo) ? "Tienda"
                : "CD".equalsIgnoreCase(tipo) ? "Centro de distribución" : null;

        return jdbc.query(sql,
                (rs, n) -> {
                    int cantidad = rs.getInt("cantidad");
                    int umbral = rs.getInt("umbral");
                    return new FilaInventario(rs.getString("tipo"), rs.getInt("ubicacion_id"),
                            rs.getString("ubicacion"), rs.getLong("id_producto"), rs.getString("producto"),
                            rs.getString("identificador"), cantidad, umbral, calcularEstado(cantidad, umbral));
                },
                UMBRAL_POR_DEFECTO, UMBRAL_POR_DEFECTO, tipoTexto, tipoTexto, ubicacionId, ubicacionId);
    }
}
