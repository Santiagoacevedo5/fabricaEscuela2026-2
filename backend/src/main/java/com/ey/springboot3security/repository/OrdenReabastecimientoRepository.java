package com.ey.springboot3security.repository;

import com.ey.springboot3security.entity.OrdenReabastecimiento;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrdenReabastecimientoRepository extends JpaRepository<OrdenReabastecimiento, Long> {
    List<OrdenReabastecimiento> findByTienda_CentroDistribucion_IdAndEstadoIn(Integer centroId, List<String> estados);
    List<OrdenReabastecimiento> findByTienda_CentroDistribucion_Id(Integer centroId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM OrdenReabastecimiento o WHERE o.id = :id")
    Optional<OrdenReabastecimiento> findByIdForUpdate(@Param("id") Long id);
}
