package com.ey.springboot3security.service;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import com.ey.springboot3security.dto.EncargadoDto;
import com.ey.springboot3security.repository.UserInfoRepository;
import org.springframework.boot.webmvc.autoconfigure.WebMvcProperties;
import org.springframework.stereotype.Service;
import com.ey.springboot3security.entity.CentroDistribucion;
import com.ey.springboot3security.entity.UserInfo;
import com.ey.springboot3security.repository.CentroDistribucionRepository;
import com.ey.springboot3security.entity.OrdenReabastecimiento;
import com.ey.springboot3security.repository.OrdenReabastecimientoRepository;

@Service
public class CentroDistribucionService {
    private final CentroDistribucionRepository centroRepository;
    private final UserInfoRepository userInfoRepository;
    private static final List<String> ESTADOS_ORDEN_ACTIVA = List.of("Pendiente","Aprobada","Enviada");
    private final OrdenReabastecimientoRepository ordenRepository;

    public CentroDistribucionService(CentroDistribucionRepository centroRepository,
                                     UserInfoRepository userInfoRepository,
                                     OrdenReabastecimientoRepository ordenRepository){
        this.centroRepository = centroRepository;
        this.userInfoRepository = userInfoRepository;
        this.ordenRepository = ordenRepository;
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

        Integer idEncActual = centroOpt.get().getEncargado() == null ? null : centroOpt.get().getEncargado().getId();
        Integer idEncNuevo = centroDistribucion.getEncargado() == null ? null : centroDistribucion.getEncargado().getId();

        if (idEncActual != null && !Objects.equals(idEncActual, idEncNuevo)){
            String detalle = detalleOrdenesActivas(id);
            if (detalle != null){
                return "No se puede quitar o cambiar el encargado del centro: tiene " + detalle;
            }
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

        if("INACTIVO".equals(centroDistribucion.getEstado())){
            String detalle = detalleOrdenesActivas(id);
            if (detalle != null){
                return "No se puede desactivar el centro: tiene " + detalle;
            }
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

    public String detalleOrdenesActivas(Integer centroId){
        List<OrdenReabastecimiento> ordenes = ordenRepository.findByTienda_CentroDistribucion_IdAndEstadoIn(centroId, ESTADOS_ORDEN_ACTIVA);

        if (ordenes.isEmpty()){
            return null;
        }

        String detalle = ordenes.stream()
                .limit(5)
                .map(o -> "#" + o.getId() + " (" + o.getTienda().getNombre() + ", " + o.getEstado() + ")")
                .collect(Collectors.joining(", "));

        if (ordenes.size() > 5){
            detalle += " y " + (ordenes.size() - 5) + " más";
        }

        return ordenes.size() + " órdenes activas: " + detalle;
    }

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
