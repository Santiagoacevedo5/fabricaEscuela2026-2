package com.ey.springboot3security.service;

import com.ey.springboot3security.entity.BloqueoUsuario;
import com.ey.springboot3security.repository.BloqueoUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// HUS-01: el contador de intentos vive en el servidor, nunca en el navegador.
// Se cuenta por nombre de usuario exista o no, para no revelar qué usuarios existen.
@Service
@RequiredArgsConstructor
public class IntentosLoginService {

    static final int MAX_INTENTOS = 3;
    static final Duration BLOQUEO = Duration.ofMinutes(15);

    private final BloqueoUsuarioRepository bloqueoRepository;

    // shortcut: en memoria, se pierde al reiniciar el servidor y no se comparte entre instancias; pasar a columnas en user_info si se despliega más de una instancia
    private final Map<String, Integer> fallos = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> bloqueadosHasta = new ConcurrentHashMap<>();
    Clock clock = Clock.systemDefaultZone();

    public boolean estaBloqueado(String username) {
        LocalDateTime hasta = bloqueadosHasta.get(username);
        if (hasta == null) {
            return false;
        }
        if (LocalDateTime.now(clock).isBefore(hasta)) {
            return true;
        }
        bloqueadosHasta.remove(username);
        return false;
    }

    /** Devuelve true si este fallo deja al usuario bloqueado. */
    public boolean registrarFallo(String username) {
        if (fallos.merge(username, 1, Integer::sum) < MAX_INTENTOS) {
            return false;
        }
        fallos.remove(username);
        LocalDateTime ahora = LocalDateTime.now(clock);
        bloqueadosHasta.put(username, ahora.plus(BLOQUEO));
        bloqueoRepository.save(new BloqueoUsuario(null, username, ahora));
        return true;
    }

    public void registrarExito(String username) {
        fallos.remove(username);
    }
}
