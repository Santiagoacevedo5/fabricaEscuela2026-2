package com.ey.springboot3security.repository;

import com.ey.springboot3security.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventarioRepository extends JpaRepository<Inventario, Long> {
    // Spring arma la consulta a partir del nombre del método
    boolean existsByProductoIdProductoAndCentroDistribucionId(Long idProducto, Integer centroId);
    boolean existsByProductoIdProductoAndTiendaId(Long idProducto, Integer tiendaId);

    List<Inventario> findByCentroDistribucionId(Integer centroId);

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