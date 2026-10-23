package com.ey.springboot3security.repository;

import com.ey.springboot3security.entity.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {

    // HUS-02 "Movimientos de mi inventario": entradas y salidas de un CD, del más reciente al más antiguo
    List<MovimientoInventario> findByInventarioCentroDistribucionIdOrderByIdDesc(Integer centroId);
}