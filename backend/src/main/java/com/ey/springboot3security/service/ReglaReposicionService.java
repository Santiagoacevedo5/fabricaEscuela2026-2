// Ruta: src/main/java/com/ey/springboot3security/service/ReglaReposicionService.java
package com.ey.springboot3security.service;

import com.ey.springboot3security.entity.ReglaReposicion;
import com.ey.springboot3security.repository.ReglaReposicionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ReglaReposicionService {
    private final ReglaReposicionRepository reglaRepository;

    public ReglaReposicionService(ReglaReposicionRepository reglaRepository) {
        this.reglaRepository = reglaRepository;
    }

    public String registrarRegla(ReglaReposicion regla) {
        if (regla.getProducto() == null || regla.getTienda() == null) {
            throw new IllegalArgumentException("Selecciona un producto y una tienda.");
        }
        validarValores(regla);
        if (reglaRepository.existsByProductoAndTienda(regla.getProducto(), regla.getTienda())) {
            throw new IllegalStateException("Ya existe una regla para este producto y tienda. No se permiten reglas duplicadas.");
        }
        regla.setId(0); // un id en el body haría que save() actualice una regla existente
        reglaRepository.save(regla);
        return "Regla de reposición creada correctamente.";
    }

    // Producto y tienda no cambian al editar: solo umbral, cantidad y estado
    public String editarRegla(int id, ReglaReposicion datos) {
        ReglaReposicion regla = reglaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Regla no encontrada."));
        validarValores(datos);
        regla.setUmbralMinimo(datos.getUmbralMinimo());
        regla.setCantidadReposicion(datos.getCantidadReposicion());
        regla.setActiva(datos.isActiva());
        reglaRepository.save(regla);
        return "Regla de reposición actualizada correctamente.";
    }

    public List<ReglaReposicion> listarReglas() {
        return reglaRepository.findAll();
    }

    private void validarValores(ReglaReposicion regla) {
        if (regla.getUmbralMinimo() <= 0 || regla.getCantidadReposicion() <= 0) {
            throw new IllegalArgumentException("El umbral mínimo y la cantidad de reposición deben ser mayores a 0.");
        }
    }
}
