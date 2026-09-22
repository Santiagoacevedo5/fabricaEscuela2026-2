package com.ey.springboot3security.service;
import java.util.List;
import java.util.Optional;

import com.ey.springboot3security.repository.UserInfoRepository;
import org.springframework.boot.webmvc.autoconfigure.WebMvcProperties;
import org.springframework.stereotype.Service;
import com.ey.springboot3security.entity.CentroDistribucion;
import com.ey.springboot3security.entity.UserInfo;
import com.ey.springboot3security.repository.CentroDistribucionRepository;

@Service
public class CentroDistribucionService {
    private final CentroDistribucionRepository centroRepository;
    private final UserInfoRepository userInfoRepository;

    public CentroDistribucionService(CentroDistribucionRepository centroRepository,
                                     UserInfoRepository userInfoRepository){
        this.centroRepository = centroRepository;
        this.userInfoRepository = userInfoRepository;
    }
    public String registrarCentro(CentroDistribucion centroDistribucion){
        if (centroDistribucion.getNombre() == null || centroDistribucion.getNombre().isBlank()){
            return "El nombre del centro es obligatorio";
        }

        if (centroDistribucion.getUbicacion() == null || centroDistribucion.getUbicacion().isBlank()){
            return "La ubicación es obligatoria";
        }

        if (centroRepository.existsByNombre(centroDistribucion.getNombre())){
            return "Ya existe un centro de distribución con ese nombre";
        }

        if (centroDistribucion.getFechaRegistro()==null){
            centroDistribucion.setFechaRegistro(java.time.LocalDate.now());
        }
        if (centroDistribucion.getEstado() == null || centroDistribucion.getEstado().isBlank()){
            centroDistribucion.setEstado("ACTIVO");
        }
        centroRepository.save(centroDistribucion);
        return "Centro de distribución registrado correctamente";
    }
    public List<CentroDistribucion> listarCentros(){
        return centroRepository.findAll();
    }

    public List<UserInfo> listarEncargadosDisponibles(){
        List<UserInfo> encargadosConRol = userInfoRepository.findByRolesContaining("ENCARGADO_CD");

        List <CentroDistribucion> centros = centroRepository.findAll();

        List<Integer> idsOcupados = centros.stream()
                .filter(centro -> centro.getEncargado() != null)
                .map(centro -> centro.getEncargado().getId())
                .toList();

        return encargadosConRol.stream()
                .filter(encargado -> !idsOcupados.contains(encargado.getId()))
                .toList();
    }
}
