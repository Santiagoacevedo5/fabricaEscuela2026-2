package com.ey.springboot3security.repository;

import com.ey.springboot3security.dto.EncargadoDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.ey.springboot3security.entity.CentroDistribucion;

import java.util.List;
import java.util.Optional;

@Repository
public interface CentroDistribucionRepository extends JpaRepository<CentroDistribucion, Integer>{
    Optional<CentroDistribucion> findByNombre(String nombre);
    Optional<CentroDistribucion> findByEncargado_Username(String username);
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Integer id);
    boolean existsByEncargado_IdAndIdNot(Integer encargadoId, Integer centroId);
    boolean existsByEncargado_Id(Integer encargadoId);
}