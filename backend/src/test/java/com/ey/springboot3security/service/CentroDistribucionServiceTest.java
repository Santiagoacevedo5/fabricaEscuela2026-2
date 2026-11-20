package com.ey.springboot3security.service;

import com.ey.springboot3security.entity.CentroDistribucion;
import com.ey.springboot3security.entity.OrdenReabastecimiento;
import com.ey.springboot3security.entity.Tienda;
import com.ey.springboot3security.entity.UserInfo;
import com.ey.springboot3security.repository.CentroDistribucionRepository;
import com.ey.springboot3security.repository.OrdenReabastecimientoRepository;
import com.ey.springboot3security.repository.UserInfoRepository;
import org.checkerframework.checker.units.qual.C;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CentroDistribucionServiceTest {
    private static final List<String> ORDENES_ACTIVAS = List.of("Pendiente", "Aprobada", "Enviada");

    @Mock
    private CentroDistribucionRepository centroRepository;

    @Mock
    private UserInfoRepository userInfoRepository;

    @Mock
    private OrdenReabastecimientoRepository ordenRepository;

    private CentroDistribucionService service;

    @BeforeEach
    void setUp(){
        service = new CentroDistribucionService(centroRepository, userInfoRepository, ordenRepository);
    }

    @Test
    void noDesactivaUnCentroConOrdenesActivas(){
        // 1.Preparar
        CentroDistribucion centro = new CentroDistribucion();
        centro.setId(3);
        centro.setEstado("ACTIVO");

        Tienda tienda = new Tienda();
        tienda.setNombre("Tienda Norte");

        OrdenReabastecimiento orden = new OrdenReabastecimiento();
        orden.setId(12L);
        orden.setTienda(tienda);
        orden.setEstado("Pendiente");

        when(centroRepository.findById(centro.getId())).thenReturn(Optional.of(centro));
        when(ordenRepository.findByTienda_CentroDistribucion_IdAndEstadoIn(centro.getId(), ORDENES_ACTIVAS)).thenReturn(List.of(orden));

        CentroDistribucion cambio = new CentroDistribucion();
        cambio.setEstado("INACTIVO");

        //2. Ejecutar
        String resultado = service.actualizarEstado(centro.getId(), cambio);

        //3.Comprobar
        assertTrue(resultado.startsWith("No se puede desactivar"));
        verify(centroRepository, never()).save(any());
    }

    @Test
    void noConsultaOrdenesSiElEncargadoNoCambia(){
        //1.Preparar
        UserInfo encargado = new UserInfo();
        encargado.setId(1);

        CentroDistribucion centro = new CentroDistribucion();
        centro.setId(3);
        centro.setEstado("ACTIVO");
        centro.setEncargado(encargado);

        when(centroRepository.findById(3)).thenReturn(Optional.of(centro));

        CentroDistribucion cambio = new CentroDistribucion();
        cambio.setNombre("Centro Norte");
        cambio.setUbicacion("Medellin");
        cambio.setEncargado(encargado);

        //2.Ejecutar
        String resultado = service.editarCentro(3, cambio);

        //3.Comprobar
        assertEquals("El centro de distribución se ha actualizado correctamente", resultado);
        verify(ordenRepository, never()).findByTienda_CentroDistribucion_IdAndEstadoIn(any(),any());
    }

    @Test
    void noCambiaElEncargadoSiElCentroTieneOrdenesActivas(){
        //1.Preparar
        UserInfo encargadoActual = new UserInfo();
        encargadoActual.setId(2);

        UserInfo encargadoNuevo = new UserInfo();
        encargadoNuevo.setId(4);

        CentroDistribucion centro = new CentroDistribucion();
        centro.setId(3);
        centro.setEstado("ACTIVO");
        centro.setEncargado(encargadoActual);

        Tienda tienda = new Tienda();
        tienda.setNombre("Tienda Norte");

        OrdenReabastecimiento orden = new OrdenReabastecimiento();
        orden.setId(12L);
        orden.setTienda(tienda);
        orden.setEstado("Pendiente");

        when(centroRepository.findById(3)).thenReturn(Optional.of(centro));
        when(ordenRepository.findByTienda_CentroDistribucion_IdAndEstadoIn(3, ORDENES_ACTIVAS)).thenReturn(List.of(orden));

        CentroDistribucion cambio = new CentroDistribucion();
        cambio.setNombre("Centro Norte");
        cambio.setUbicacion("Medellin");
        cambio.setEncargado(encargadoNuevo);

        //2.Ejecutar
        String resultado = service.editarCentro(3, cambio);

        //3.Comprobar
        assertTrue(resultado.startsWith("No se puede quitar o cambiar el encargado del centro: tiene "));
        verify(centroRepository, never()).save(any());
    }

    @Test
    void cambiaElEncargadoSiNoHayOrdenesActivas(){
        //1.Preparar

        UserInfo encargadoActual = new UserInfo();
        encargadoActual.setId(6);

        UserInfo encargadoNuevo = new UserInfo();
        encargadoNuevo.setId(8);

        CentroDistribucion centro = new CentroDistribucion();
        centro.setId(5);
        centro.setEstado("ACTIVO");
        centro.setEncargado(encargadoActual);

        Tienda tienda = new Tienda();
        tienda.setNombre("Tienda Sur");

        OrdenReabastecimiento orden = new OrdenReabastecimiento();
        orden.setId(12L);
        orden.setTienda(tienda);
        orden.setEstado(null);

        when(centroRepository.findById(5)).thenReturn(Optional.of(centro));
        when(ordenRepository.findByTienda_CentroDistribucion_IdAndEstadoIn(5,ORDENES_ACTIVAS)).thenReturn(List.of());

        CentroDistribucion cambio = new CentroDistribucion();
        cambio.setNombre("Centro Sur");
        cambio.setUbicacion("Medellin");
        cambio.setEncargado(encargadoNuevo);

        //2.Ejecutar
        String resultado = service.editarCentro(5, cambio);

        //3.Comprobar

        assertTrue(resultado.startsWith("El centro de distribución se ha actualizado correctamente"));
        verify(centroRepository).save(centro);
    }

    @Test
    void asignarEncargadoACentroSinEncargadoSinConsultarOrdenes(){
        //1.Preparar
        UserInfo encargadoNuevo = new UserInfo();
        encargadoNuevo.setId(9);

        CentroDistribucion centro = new CentroDistribucion();
        centro.setId(10);
        centro.setEstado("ACTIVO");

        when(centroRepository.findById(10)).thenReturn(Optional.of(centro));

        CentroDistribucion cambio = new CentroDistribucion();
        cambio.setNombre("Centro Oriente");
        cambio.setUbicacion("Medellin");
        cambio.setEncargado(encargadoNuevo);

        //2.Ejecutar
        String resultado = service.editarCentro(10, cambio);

        //3.Comprobar
        assertEquals("El centro de distribución se ha actualizado correctamente", resultado);
        verify(ordenRepository, never()).findByTienda_CentroDistribucion_IdAndEstadoIn(any(),any());
    }

}
