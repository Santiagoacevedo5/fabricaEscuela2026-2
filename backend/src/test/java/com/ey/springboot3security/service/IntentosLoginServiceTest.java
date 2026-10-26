package com.ey.springboot3security.service;

import com.ey.springboot3security.entity.BloqueoUsuario;
import com.ey.springboot3security.repository.BloqueoUsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class IntentosLoginServiceTest {

    @Mock
    private BloqueoUsuarioRepository bloqueoRepository;

    @InjectMocks
    private IntentosLoginService intentos;

    @Test
    void tresFallosBloqueanQuinceMinutosYQuedaAuditado() {
        assertFalse(intentos.registrarFallo("ana"));
        assertFalse(intentos.registrarFallo("ana"));
        assertTrue(intentos.registrarFallo("ana"));

        assertTrue(intentos.estaBloqueado("ana"));
        verify(bloqueoRepository).save(argThat((BloqueoUsuario b) -> b.getUsername().equals("ana") && b.getFecha() != null));

        intentos.clock = Clock.offset(Clock.systemDefaultZone(), Duration.ofMinutes(14));
        assertTrue(intentos.estaBloqueado("ana"));
        intentos.clock = Clock.offset(Clock.systemDefaultZone(), Duration.ofMinutes(16));
        assertFalse(intentos.estaBloqueado("ana"));
    }

    @Test
    void loginCorrectoReiniciaElContador() {
        intentos.registrarFallo("ana");
        intentos.registrarFallo("ana");
        intentos.registrarExito("ana");

        assertFalse(intentos.registrarFallo("ana"));
        assertFalse(intentos.estaBloqueado("ana"));
        verify(bloqueoRepository, never()).save(any());
    }
}
