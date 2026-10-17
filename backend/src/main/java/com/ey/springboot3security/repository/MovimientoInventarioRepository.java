package com.ey.springboot3security.repository;

import com.ey.springboot3security.entity.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {
}
