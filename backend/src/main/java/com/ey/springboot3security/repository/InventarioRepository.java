package com.ey.springboot3security.repository;

import com.ey.springboot3security.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventarioRepository extends JpaRepository<Inventario, Long> {
    // Spring arma la consulta a partir del nombre del método
    boolean existsByProductoIdProductoAndCentroDistribucionId(Long idProducto, Integer centroId);
    boolean existsByProductoIdProductoAndTiendaId(Long idProducto, Integer tiendaId);

    List<Inventario> findByCentroDistribucionId(Integer centroId);

    // Despacho: fila de inventario de un producto en una tienda (vacía si la tienda nunca lo ha tenido)
    Optional<Inventario> findByProductoIdProductoAndTiendaId(Long idProducto, Integer tiendaId);
}