package com.ey.springboot3security.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.ey.springboot3security.entity.Tienda;
import com.ey.springboot3security.repository.TiendaRepository;

@Service
public class TiendaService {

    private final TiendaRepository repository;

    public TiendaService(TiendaRepository repository) {
        this.repository = repository;
    }

    public Tienda registrarTienda(Tienda tienda) {
        return repository.save(tienda);
    }

    public List<Tienda> listarTiendas() {
        return repository.findAll();
    }

    // Método añadido para HU3.5 - Editar Tienda
    public Tienda actualizarTienda(Integer id, Tienda tiendaDetalles) {
        Tienda tienda = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tienda no encontrada"));

        // Validar si cambia de encargado y si ya está asignado en otra tienda activa
        if (tiendaDetalles.getEncargado() != null && tiendaDetalles.getEncargado().getId() != null) {
            Integer nuevoEncargadoId = tiendaDetalles.getEncargado().getId();
            Integer encargadoActualId = (tienda.getEncargado() != null) ? tienda.getEncargado().getId() : null;

            if (!nuevoEncargadoId.equals(encargadoActualId)) {
                boolean ocupado = repository.existsByEncargadoIdAndIdNotAndActivaTrue(nuevoEncargadoId, id);
                if (ocupado) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El encargado ya está asignado a otra tienda activa.");
                }
            }
            tienda.setEncargado(tiendaDetalles.getEncargado());
        } else {
            tienda.setEncargado(null);
        }

        tienda.setDireccion(tiendaDetalles.getDireccion());
        tienda.setRegion(tiendaDetalles.getRegion());
        
        if (tiendaDetalles.getActiva() != null) {
            tienda.setActiva(tiendaDetalles.getActiva());
        }

        return repository.save(tienda);
    }
}