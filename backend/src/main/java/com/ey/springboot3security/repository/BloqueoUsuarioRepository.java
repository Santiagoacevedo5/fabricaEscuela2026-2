package com.ey.springboot3security.repository;

import com.ey.springboot3security.entity.BloqueoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BloqueoUsuarioRepository extends JpaRepository<BloqueoUsuario, Long> {
}
