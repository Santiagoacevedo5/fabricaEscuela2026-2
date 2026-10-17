package com.ey.springboot3security.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.ey.springboot3security.dto.EncargadoDto;
import com.ey.springboot3security.entity.Tienda;
import com.ey.springboot3security.entity.UserInfo;
import com.ey.springboot3security.repository.TiendaRepository;
import com.ey.springboot3security.repository.UserInfoRepository;

@Service
public class TiendaService {

    private final TiendaRepository repository;
    private final UserInfoRepository userInfoRepository;

    public TiendaService(TiendaRepository repository, UserInfoRepository userInfoRepository) {
        this.repository = repository;
        this.userInfoRepository = userInfoRepository;
    }

    public Tienda registrarTienda(Tienda tienda) {
        // el formulario no envía "activa": sin esto se guardaría null y la columna es NOT NULL
        if (tienda.getActiva() == null) tienda.setActiva(true);
        return repository.save(tienda);
    }

    public List<Tienda> listarTiendas() {
        return repository.findAll();
    }

    public List<EncargadoDto> listarEncargadosDisponibles() {
        return repository.findEncargadosDisponibles();
    }

    // HU3.5 - Editar Tienda: el nombre y el id no se tocan (no son editables)
    public Tienda actualizarTienda(Integer id, Tienda detalles) {
        Tienda tienda = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tienda no encontrada"));

        if (detalles.getDireccion() == null || detalles.getDireccion().isBlank()
                || detalles.getRegion() == null || detalles.getRegion().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La dirección y la región son obligatorias.");
        }

        UserInfo encargado = null;
        if (detalles.getEncargado() != null && detalles.getEncargado().getId() != null) {
            Integer encargadoId = detalles.getEncargado().getId();
            encargado = userInfoRepository.findById(encargadoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Encargado no encontrado"));
            if (repository.existsByEncargadoIdAndIdNot(encargadoId, id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El encargado ya está asignado a otra tienda.");
            }
        }

        tienda.setEncargado(encargado);
        tienda.setDireccion(detalles.getDireccion().trim());
        tienda.setRegion(detalles.getRegion().trim());
        if (detalles.getActiva() != null) {
            tienda.setActiva(detalles.getActiva());
        }

        return repository.save(tienda);
    }
}