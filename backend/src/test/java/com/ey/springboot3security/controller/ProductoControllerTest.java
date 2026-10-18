package com.ey.springboot3security.controller;

import com.ey.springboot3security.entity.Producto;
import com.ey.springboot3security.repository.ProductoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductoControllerTest {

    @Mock
    private ProductoRepository productoRepository;

    @InjectMocks
    private ProductoController productoController;

    @Test
    void actualizarProductoGuardaLosCamposDelFormulario() {
        Producto existente = new Producto();
        existente.setIdProducto(1L);
        existente.setIdentificador("SKU-1");
        when(productoRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(productoRepository.findByIdentificador("SKU-1")).thenReturn(Optional.of(existente));
        when(productoRepository.save(any(Producto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Producto cambios = new Producto();
        cambios.setIdentificador("SKU-1");
        cambios.setNombre("Camiseta");
        cambios.setCategoria("Ropa");
        cambios.setDescripcion("Algodón");
        cambios.setActivo(false);

        var respuesta = productoController.actualizarProducto(1L, cambios);

        assertEquals(HttpStatus.OK, respuesta.getStatusCode());
        assertSame(existente, respuesta.getBody());
        assertEquals("Camiseta", existente.getNombre());
        assertEquals("Ropa", existente.getCategoria());
        assertEquals("Algodón", existente.getDescripcion());
        assertEquals(false, existente.isActivo());
        verify(productoRepository).save(existente);
    }

    @Test
    void actualizarProductoDevuelve404SiNoExiste() {
        when(productoRepository.findById(1L)).thenReturn(Optional.empty());

        Producto cambios = new Producto();
        cambios.setIdentificador("SKU-1");
        cambios.setNombre("Camiseta");
        cambios.setCategoria("Ropa");

        var respuesta = productoController.actualizarProducto(1L, cambios);

        assertEquals(HttpStatus.NOT_FOUND, respuesta.getStatusCode());
    }

    @Test
    void actualizarProductoRechazaUnIdentificadorUsadoPorOtroProducto() {
        Producto existente = new Producto();
        existente.setIdProducto(1L);
        Producto otroProducto = new Producto();
        otroProducto.setIdProducto(2L);
        when(productoRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(productoRepository.findByIdentificador("SKU-2")).thenReturn(Optional.of(otroProducto));

        Producto cambios = new Producto();
        cambios.setIdentificador("SKU-2");
        cambios.setNombre("Camiseta");
        cambios.setCategoria("Ropa");

        var respuesta = productoController.actualizarProducto(1L, cambios);

        assertEquals(HttpStatus.CONFLICT, respuesta.getStatusCode());
    }
}
