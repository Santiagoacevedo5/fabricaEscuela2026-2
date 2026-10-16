package com.ey.springboot3security.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ey.springboot3security.entity.Tienda;

@Repository
public interface TiendaRepository extends JpaRepository<Tienda, Integer> {

    // Valida si el encargado ya está asignado a otra tienda activa distinta a la actual
    boolean existsByEncargadoIdAndIdNotAndActivaTrue(Integer encargadoId, Integer tiendaId);
}