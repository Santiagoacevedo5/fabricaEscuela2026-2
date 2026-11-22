package com.ey.springboot3security.service;

import com.ey.springboot3security.dto.OrdenDtos.CambioEstado;
import com.ey.springboot3security.dto.OrdenDtos.DetalleOrden;
import com.ey.springboot3security.dto.OrdenDtos.ItemOrden;
import com.ey.springboot3security.dto.OrdenDtos.MisOrdenes;
import com.ey.springboot3security.dto.OrdenDtos.RecepcionConfirmada;
import com.ey.springboot3security.dto.OrdenDtos.ResumenOrden;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

// HU7.3: el encargado de tienda consulta y recibe SOLO las ordenes de su tienda.
// La tienda se obtiene siempre del usuario del token, nunca de un parametro.
@Service
public class OrdenTiendaService {

    private final JdbcTemplate jdbc;

    public OrdenTiendaService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private record TiendaEncargado(Integer id, String nombre) {
    }

    private TiendaEncargado tiendaDe(String username) {
        List<TiendaEncargado> r = jdbc.query(
                "select t.id, t.nombre from tienda t "
                        + "join user_info u on u.id = t.encargado_id where u.username = ?",
                (rs, i) -> new TiendaEncargado(rs.getInt("id"), rs.getString("nombre")),
                username);
        if (r.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No tienes una tienda asignada");
        }
        return r.get(0);
    }

    private static LocalDateTime fecha(ResultSet rs, String col) throws SQLException {
        Timestamp ts = rs.getTimestamp(col);
        return ts == null ? null : ts.toLocalDateTime();
    }

    private static LocalDateTime aFecha(Object valor) {
        return valor == null ? null : ((Timestamp) valor).toLocalDateTime();
    }

    // Escenario 1: consultar mis ordenes
    @Transactional(readOnly = true)
    public MisOrdenes misOrdenes(String username) {
        TiendaEncargado t = tiendaDe(username);
        List<ResumenOrden> ordenes = jdbc.query(
                "select o.id, o.estado, o.fecha_creacion, "
                        + "count(i.id) as productos, coalesce(sum(i.cantidad), 0) as unidades "
                        + "from orden_reabastecimiento o "
                        + "left join orden_item i on i.orden_id = o.id "
                        + "where o.tienda_id = ? "
                        + "group by o.id, o.estado, o.fecha_creacion "
                        + "order by o.id desc",
                (rs, n) -> new ResumenOrden(rs.getLong("id"), rs.getInt("productos"),
                        rs.getInt("unidades"), fecha(rs, "fecha_creacion"), rs.getString("estado")),
                t.id());
        return new MisOrdenes(t.nombre(), ordenes);
    }

    // Escenarios 2 y 4: detalle con historial; acceso denegado si la orden es de otra tienda
    @Transactional(readOnly = true)
    public DetalleOrden detalle(Long id, String username) {
        TiendaEncargado t = tiendaDe(username);

        List<Map<String, Object>> o = jdbc.queryForList(
                "select estado, tienda_id, fecha_creacion, revisado_por, fecha_revision, "
                        + "enviado_por, fecha_envio from orden_reabastecimiento where id = ?", id);
        if (o.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La orden no existe");
        }
        Map<String, Object> orden = o.get(0);
        if (((Number) orden.get("tienda_id")).intValue() != t.id()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a esta orden");
        }
        String estado = (String) orden.get("estado");

        List<ItemOrden> productos = jdbc.query(
                "select p.nombre, p.identificador, i.cantidad from orden_item i "
                        + "join producto p on p.id_producto = i.producto_id "
                        + "where i.orden_id = ? order by i.id",
                (rs, n) -> new ItemOrden(rs.getString("nombre"),
                        rs.getString("identificador"), rs.getInt("cantidad")),
                id);

        return new DetalleOrden(id, t.nombre(), estado, productos, historial(id, estado, orden));
    }

    // Historial de cambios de estado con fecha y hora. Se arma con las columnas de la propia orden
    // (creacion, revision, envio) para no depender de que las otras HU escriban en el historial,
    // y la recepcion sale de orden_historial_estado.
    private List<CambioEstado> historial(Long id, String estado, Map<String, Object> orden) {
        List<CambioEstado> h = new ArrayList<>();
        h.add(new CambioEstado("Pendiente", aFecha(orden.get("fecha_creacion")), null));

        LocalDateTime revision = aFecha(orden.get("fecha_revision"));
        if (revision != null) {
            h.add(new CambioEstado("Rechazada".equals(estado) ? "Rechazada" : "Aprobada",
                    revision, (String) orden.get("revisado_por")));
        }
        LocalDateTime envio = aFecha(orden.get("fecha_envio"));
        if (envio != null) {
            h.add(new CambioEstado("Enviada", envio, (String) orden.get("enviado_por")));
        }
        List<CambioEstado> recibida = jdbc.query(
                "select estado, fecha, usuario from orden_historial_estado "
                        + "where orden_id = ? and estado = 'Recibida' order by fecha desc, id desc limit 1",
                (rs, n) -> new CambioEstado(rs.getString("estado"), fecha(rs, "fecha"), rs.getString("usuario")),
                id);
        h.addAll(recibida);

        h.sort(Comparator.comparing(CambioEstado::fecha, Comparator.nullsFirst(Comparator.naturalOrder())));
        return h;
    }

    // Escenario 3: confirmar recepcion (Enviada -> Recibida) y subir el inventario de la tienda
    @Transactional
    public RecepcionConfirmada confirmarRecepcion(Long id, String username) {
        TiendaEncargado t = tiendaDe(username);

        List<Map<String, Object>> o = jdbc.queryForList(
                "select estado, tienda_id from orden_reabastecimiento where id = ? for update", id);
        if (o.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La orden no existe");
        }
        if (((Number) o.get(0).get("tienda_id")).intValue() != t.id()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a esta orden");
        }
        if (!"Enviada".equals(o.get(0).get("estado"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede confirmar la recepción de una orden Enviada");
        }

        List<Map<String, Object>> items = jdbc.queryForList(
                "select producto_id, cantidad from orden_item where orden_id = ?", id);

        int total = 0;
        for (Map<String, Object> it : items) {
            long productoId = ((Number) it.get("producto_id")).longValue();
            int cantidad = ((Number) it.get("cantidad")).intValue();

            List<Long> filas = jdbc.queryForList(
                    "select id from inventario where tienda_id = ? and producto_id = ? for update",
                    Long.class, t.id(), productoId);
            long inventarioId;
            if (filas.isEmpty()) {
                inventarioId = jdbc.queryForObject(
                        "insert into inventario (cantidad, fecha_creacion, producto_id, tienda_id) "
                                + "values (?, current_date, ?, ?) returning id",
                        Long.class, cantidad, productoId, t.id());
            } else {
                inventarioId = filas.get(0);
                jdbc.update("update inventario set cantidad = coalesce(cantidad, 0) + ? where id = ?",
                        cantidad, inventarioId);
            }

            // Queda registrado en el historial de movimientos como ENTRADA
            jdbc.update(
                    "insert into movimiento_inventario (inventario_id, tipo, cantidad, usuario, fecha) "
                            + "values (?, 'ENTRADA', ?, ?, ?)",
                    inventarioId, cantidad, username, Timestamp.valueOf(LocalDateTime.now()));
            total += cantidad;
        }

        jdbc.update("update orden_reabastecimiento set estado = 'Recibida' where id = ?", id);
        jdbc.update(
                "insert into orden_historial_estado (orden_id, estado, fecha, usuario) values (?, 'Recibida', ?, ?)",
                id, Timestamp.valueOf(LocalDateTime.now()), username);

        return new RecepcionConfirmada(id, t.nombre(), total);
    }
}
