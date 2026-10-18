package com.ey.springboot3security.dto;
 
// Solo id y nombre: así el endpoint no expone la contraseña ni otros datos del empleado
public record EncargadoDto(Integer id, String nombre) {
}
 