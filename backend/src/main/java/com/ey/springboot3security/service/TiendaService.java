package com.ey.springboot3security.service;

import java.util.List;

import org.springframework.stereotype.Service;

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
}