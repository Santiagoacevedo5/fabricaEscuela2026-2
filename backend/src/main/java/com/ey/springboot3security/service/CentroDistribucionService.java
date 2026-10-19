package com.ey.springboot3security.service;
import java.util.List;
import java.util.Optional;

import com.ey.springboot3security.dto.EncargadoDto;
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

        if (!centroDistribucion.getNombre().matches("[\\p{L} ]+")){
            return "El nombre solo puede contener letras";
        }

        if (centroDistribucion.getUbicacion() == null || centroDistribucion.getUbicacion().isBlank()){
            return "La ubicación es obligatoria";
        }

        if (centroRepository.existsByNombreIgnoreCase(centroDistribucion.getNombre())){
            return "Ya existe un centro de distribución con ese nombre";
        }

        if (centroDistribucion.getEncargado() != null && centroRepository.existsByEncargado_Id(centroDistribucion.getEncargado().getId())){
            return "El encargado ya tiene asignado otro centro";
        }

        if (centroDistribucion.getFechaRegistro()==null){
            centroDistribucion.setFechaRegistro(java.time.LocalDate.now());
        }

        if (centroDistribucion.getEstado()==null || centroDistribucion.getEstado().isBlank()){
            centroDistribucion.setEstado("ACTIVO");
        }

        centroRepository.save(centroDistribucion);
        return "Centro de distribución registrado correctamente";
    }

    //Aquí empieza HU 3.6
    public String editarCentro(Integer id, CentroDistribucion centroDistribucion){
        Optional<CentroDistribucion> centroOpt = centroRepository.findById(id);
        if (centroOpt.isEmpty()){
            return "El centro ingresado no existe";
        }

        if (centroDistribucion.getNombre() == null || centroDistribucion.getNombre().isBlank()){
            return "El nombre del centro es obligatorio";
        }

        if (!centroDistribucion.getNombre().matches("[\\p{L} ]+")){
            return "El nombre solo puede contener letras";
        }

        if ("INACTIVO".equals(centroOpt.get().getEstado()) && centroDistribucion.getEncargado() != null){
            return "Un centro inactivo no puede tener encargado asignado";
        }

        if (centroDistribucion.getUbicacion() == null || centroDistribucion.getUbicacion().isBlank()){
            return "La ubicación es obligatoria";
        }

        if (centroRepository.existsByNombreIgnoreCaseAndIdNot(centroDistribucion.getNombre(),id)){
            return "Ya existe un centro de distribución con ese nombre";
        }

        if (centroDistribucion.getEncargado() != null && centroRepository.existsByEncargado_IdAndIdNot(centroDistribucion.getEncargado().getId(), id)){
            return "El encargado ya tiene asignado otro centro";
        }

        CentroDistribucion centro = centroOpt.get();
        centro.setNombre(centroDistribucion.getNombre());
        centro.setUbicacion(centroDistribucion.getUbicacion());
        centro.setEncargado(centroDistribucion.getEncargado());

        centroRepository.save(centro);
        return "El centro de distribución se ha actualizado correctamente";
    }

    public String actualizarEstado(int id, CentroDistribucion centroDistribucion){
        Optional<CentroDistribucion> centroOpt = centroRepository.findById(id);
        if (centroOpt.isEmpty()){
            return "El centro solicitado no existe";
        }

        if(!"ACTIVO".equals(centroDistribucion.getEstado()) && !"INACTIVO".equals(centroDistribucion.getEstado())){
            return "El estado de un centro solo puede ser ACTIVO o INACTIVO";
        }

        CentroDistribucion centro = centroOpt.get();
        centro.setEstado(centroDistribucion.getEstado());
        if("INACTIVO".equals(centroDistribucion.getEstado())){
            centro.setEncargado(null);
        }
        centroRepository.save(centro);

        return "El estado del centro ha sido actualizado con éxito";
    }
    //Aquí termina HU 3.6


    public List<CentroDistribucion> listarCentros(){
        return centroRepository.findAll();
    }

    public List<EncargadoDto> listarEncargadosDisponibles(){
        List<UserInfo> encargadosConRol = userInfoRepository.findByRolesContaining("ENCARGADO_CD");

        List<CentroDistribucion> centros = centroRepository.findAll();

        List<Integer> idsOcupados = centros.stream()
                .filter(centro -> centro.getEncargado() != null)
                .map(centro -> centro.getEncargado().getId())
                .toList();

        return encargadosConRol.stream()
                .filter(encargado -> !idsOcupados.contains(encargado.getId()))
                .map(encargado -> new EncargadoDto(encargado.getId(), encargado.getName()))
                .toList();
    }
}
