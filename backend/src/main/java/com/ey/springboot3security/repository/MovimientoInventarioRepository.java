package com.ey.springboot3security.repository;

import com.ey.springboot3security.dto.DemandaProducto;
import com.ey.springboot3security.dto.DemandaTienda;
import com.ey.springboot3security.entity.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {

    // HUS-02 "Movimientos de mi inventario": entradas y salidas de un CD, del más reciente al más antiguo
    List<MovimientoInventario> findByInventarioCentroDistribucionIdOrderByIdDesc(Integer centroId);

    // HU5.1, escenario 1: unidades vendidas por producto en una tienda y un rango de fechas,
    // de mayor a menor. La suma la hace la base de datos (escenario 4: rendimiento).
    // El rango es [desde, hasta): incluye desde y excluye hasta.
    @Query("""
            SELECT p.idProducto AS idProducto,
                   p.identificador AS identificador,
                   p.nombre AS nombre,
                   SUM(m.cantidad) AS unidades
            FROM MovimientoInventario m
            JOIN m.inventario i
            JOIN i.producto p
            WHERE m.tipo = 'VENTA'
              AND i.tienda.id = :tiendaId
              AND m.fecha >= :desde
              AND m.fecha < :hasta
            GROUP BY p.idProducto, p.identificador, p.nombre
            ORDER BY SUM(m.cantidad) DESC
            """)
    List<DemandaProducto> demandaPorTienda(@Param("tiendaId") Integer tiendaId,
                                           @Param("desde") LocalDateTime desde,
                                           @Param("hasta") LocalDateTime hasta);

    // HU5.1, escenario 3: unidades vendidas de un producto en cada tienda, para comparar.
    // Solo cuenta las tiendas de la lista (las del CD del encargado, o todas para el admin).
    @Query("""
            SELECT t.id AS tiendaId,
                   t.nombre AS tienda,
                   SUM(m.cantidad) AS unidades
            FROM MovimientoInventario m
            JOIN m.inventario i
            JOIN i.tienda t
            WHERE m.tipo = 'VENTA'
              AND i.producto.idProducto = :productoId
              AND t.id IN :tiendaIds
              AND m.fecha >= :desde
              AND m.fecha < :hasta
            GROUP BY t.id, t.nombre
            ORDER BY SUM(m.cantidad) DESC
            """)
    List<DemandaTienda> demandaProductoPorTienda(@Param("productoId") Long productoId,
                                                 @Param("tiendaIds") List<Integer> tiendaIds,
                                                 @Param("desde") LocalDateTime desde,
                                                 @Param("hasta") LocalDateTime hasta);
}