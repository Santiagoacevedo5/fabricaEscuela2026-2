package com.ey.springboot3security.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;


@RestControllerAdvice
public class ManejadorErrores {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<String> datosConFormatoInvalido(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(
                "Error: Los datos enviados no tienen un formato válido. La cantidad debe ser un número entero.");
    }
}