package com.ey.springboot3security.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.ey.springboot3security.entity.CentroDistribucion;
import java.util.Optional;

@Repository
public interface CentroDistribucionRepository extends JpaRepository<CentroDistribucion, Integer>{
    Optional<CentroDistribucion> findByNombre(String nombre);
    boolean existsByNombre(String nombre);
}