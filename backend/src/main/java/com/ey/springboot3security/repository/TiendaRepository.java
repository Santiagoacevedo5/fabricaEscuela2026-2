package com.ey.springboot3security.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.ey.springboot3security.dto.EncargadoDto;
import com.ey.springboot3security.entity.Tienda;

@Repository
public interface TiendaRepository extends JpaRepository<Tienda, Integer> {

    // ¿El encargado ya está asignado a una tienda distinta de la que se edita?
    boolean existsByEncargadoIdAndIdNot(Integer encargadoId, Integer id);
    boolean existsByEncargado_Id(Integer encargadoId);

    // Empleados con rol de encargado de tienda que aún no tienen ninguna tienda asignada
    @Query("SELECT new com.ey.springboot3security.dto.EncargadoDto(u.id, u.name) FROM UserInfo u "
         + "WHERE u.roles LIKE '%ENCARGADO_TIENDA%' "
         + "AND (u.estado IS NULL OR u.estado <> 'Inactivo') "
         + "AND NOT EXISTS (SELECT t FROM Tienda t WHERE t.encargado = u)")
    List<EncargadoDto> findEncargadosDisponibles();
}