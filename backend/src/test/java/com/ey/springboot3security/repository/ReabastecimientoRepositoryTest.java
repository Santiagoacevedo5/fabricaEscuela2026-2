package com.ey.springboot3security.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:reabastecimiento;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ReabastecimientoRepositoryTest {
    @Autowired
    private ReglaReposicionRepository reglaRepository;

    @Autowired
    private OrdenItemRepository ordenItemRepository;

    @Test
    void ejecutaLasConsultasDeRecomendacionesYOrdenesActivas() {
        assertTrue(reglaRepository.findRecomendacionesActivas(1).isEmpty());
        assertTrue(ordenItemRepository.findOrdenesActivas(1, List.of("Pendiente", "Aprobada", "Enviada")).isEmpty());
    }
}
