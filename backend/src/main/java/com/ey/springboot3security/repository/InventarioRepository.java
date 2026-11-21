package com.ey.springboot3security.repository;

import com.ey.springboot3security.entity.Inventario;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventarioRepository extends JpaRepository<Inventario, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventario i WHERE i.id = :id")
    Optional<Inventario> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventario i WHERE i.producto.idProducto = :productoId AND i.tienda.id = :tiendaId")
    Optional<Inventario> findByProductoYTiendaForUpdate(
            @Param("productoId") Long productoId, @Param("tiendaId") Integer tiendaId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventario i WHERE i.producto.idProducto = :productoId "
            + "AND i.centroDistribucion.id = :centroId")
    Optional<Inventario> findByProductoYCentroForUpdate(
            @Param("productoId") Long productoId, @Param("centroId") Integer centroId);

    // HU8.1: stock actual por producto en una tienda o en todas las tiendas (tiendaId null). Filas {idProducto, stock}.
    @Query("SELECT i.producto.idProducto, SUM(i.cantidad) FROM Inventario i "
            + "WHERE i.tienda IS NOT NULL AND (:tiendaId IS NULL OR i.tienda.id = :tiendaId) "
            + "GROUP BY i.producto.idProducto")
    List<Object[]> stockTiendasPorProducto(@Param("tiendaId") Integer tiendaId);

    // Spring arma la consulta a partir del nombre del método
    boolean existsByProductoIdProductoAndCentroDistribucionId(Long idProducto, Integer centroId);
    boolean existsByProductoIdProductoAndTiendaId(Long idProducto, Integer tiendaId);

    List<Inventario> findByCentroDistribucionId(Integer centroId);

    // "Mi inventario": productos de una tienda
    List<Inventario> findByTiendaId(Integer tiendaId);

    // Despacho: fila de inventario de un producto en una tienda (vacía si la tienda nunca lo ha tenido)
    Optional<Inventario> findByProductoIdProductoAndTiendaId(Long idProducto, Integer tiendaId);

    // Entradas al CD: fila de inventario de un producto en un CD (vacía si el CD nunca lo ha tenido)
    Optional<Inventario> findByProductoIdProductoAndCentroDistribucionId(Long idProducto, Integer centroId);

    // Capacidad: total de unidades de una ubicación, sumando todos sus productos (0 si no tiene nada)
    @Query("SELECT COALESCE(SUM(i.cantidad), 0) FROM Inventario i WHERE i.centroDistribucion.id = :centroId")
    long totalEnCentro(@Param("centroId") Integer centroId);

    @Query("SELECT COALESCE(SUM(i.cantidad), 0) FROM Inventario i WHERE i.tienda.id = :tiendaId")
    long totalEnTienda(@Param("tiendaId") Integer tiendaId);
}