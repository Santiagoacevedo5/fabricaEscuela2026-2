// Ruta: src/main/java/com/ey/springboot3security/repository/ReglaReposicionRepository.java
package com.ey.springboot3security.repository;

import com.ey.springboot3security.dto.RecomendacionBase;
import com.ey.springboot3security.entity.Inventario;
import com.ey.springboot3security.entity.Producto;
import com.ey.springboot3security.entity.ReglaReposicion;
import com.ey.springboot3security.entity.Tienda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReglaReposicionRepository extends JpaRepository<ReglaReposicion, Integer> {
    boolean existsByProductoAndTienda(Producto producto, Tienda tienda);
    Optional<ReglaReposicion> findByProductoIdProductoAndTiendaIdAndActivaTrue(Long productoId, Integer tiendaId);

    @Query("""
            SELECT new com.ey.springboot3security.dto.RecomendacionBase(
                r.id, p.idProducto, p.nombre, p.identificador, t.id, t.nombre, t.region,
                COALESCE(invTienda.cantidad, 0), r.umbralMinimo,
                COALESCE(invCentro.cantidad, 0), r.cantidadReposicion)
            FROM ReglaReposicion r
            JOIN r.producto p
            JOIN r.tienda t
            LEFT JOIN Inventario invTienda ON invTienda.producto = p AND invTienda.tienda = t
            LEFT JOIN Inventario invCentro
                ON invCentro.producto = p AND invCentro.centroDistribucion = t.centroDistribucion
            WHERE r.activa = true
                AND t.centroDistribucion.id = :centroId
                AND COALESCE(invTienda.cantidad, 0) < r.umbralMinimo
            ORDER BY t.nombre, p.nombre
            """)
    List<RecomendacionBase> findRecomendacionesActivas(@Param("centroId") Integer centroId);
}
