package com.ey.springboot3security.repository;

import com.ey.springboot3security.dto.OrdenActivaReposicionData;
import com.ey.springboot3security.entity.OrdenItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface OrdenItemRepository extends JpaRepository<OrdenItem, Long> {
    @Query("""
            SELECT new com.ey.springboot3security.dto.OrdenActivaReposicionData(
                item.producto.idProducto, item.cantidad, item.orden.estado)
            FROM OrdenItem item
            WHERE item.orden.tienda.centroDistribucion.id = :centroId
                AND item.orden.estado IN :estados
            ORDER BY item.id DESC
            """)
    List<OrdenActivaReposicionData> findOrdenesActivas(
            @Param("centroId") Integer centroId, @Param("estados") Collection<String> estados);

    List<OrdenItem> findByOrden_Id(Long ordenId);
}
