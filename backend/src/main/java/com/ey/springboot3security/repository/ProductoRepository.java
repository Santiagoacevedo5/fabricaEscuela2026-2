// Ruta: backend/src/main/java/com/ey/springboot3security/repository/ProductoRepository.java
package com.ey.springboot3security.repository;

import com.ey.springboot3security.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    // Consulta para validar si el identificador único ya existe
    Optional<Producto> findByIdentificador(String identificador);
}