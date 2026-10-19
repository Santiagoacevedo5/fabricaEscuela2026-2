package com.ey.springboot3security.service;

import com.ey.springboot3security.entity.Inventario;
import com.ey.springboot3security.entity.CentroDistribucion;
import com.ey.springboot3security.entity.Producto;
import com.ey.springboot3security.repository.CentroDistribucionRepository;
import com.ey.springboot3security.repository.InventarioRepository;
import com.ey.springboot3security.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InventarioCentroService {

    private final CentroDistribucionRepository centroRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;

    public InventarioCentroService(CentroDistribucionRepository centroRepository,
                                   ProductoRepository productoRepository,
                                   InventarioRepository inventarioRepository){
        this.centroRepository = centroRepository;
        this.productoRepository = productoRepository;
        this.inventarioRepository = inventarioRepository;
    }

    public String agregarProductoCD(Integer centroId, String username, boolean esAdmin, Inventario datos){
        Optional<CentroDistribucion> cdOpt = centroRepository.findById(centroId);

        if(cdOpt.isEmpty()){
            return "El centro de distribución no existe";
        }

        CentroDistribucion cd = cdOpt.get();

        if(!esAdmin && (cd.getEncargado() == null || !username.equals(cd.getEncargado().getUsername()))){
            return "No tienes acceso a este centro de distribución";
        }

        if(!"ACTIVO".equals(cd.getEstado())){
            return "El centro de distribución está inactivo";
        }

        if (datos.getProducto() == null || datos.getProducto().getIdProducto() == null){
            return "El producto es obligatorio";
        }

        if (datos.getCantidad() == null || datos.getCantidad() < 0){
            return "La cantidad debe ser 0 o mayor";
        }

        Optional<Producto> pdOpt = productoRepository.findById(datos.getProducto().getIdProducto());

        if(pdOpt.isEmpty()){
            return "El producto no existe";
        }

        Producto producto = pdOpt.get();

        if(!producto.isActivo()){
            return "El producto está inactivo y no se puede agregar al inventario";
        }

        if(inventarioRepository.existsByProductoIdProductoAndCentroDistribucionId(producto.getIdProducto(), cd.getId())){
            return "Este producto ya está en el inventario de este centro";
        }

        Inventario nuevo = new Inventario();
        nuevo.setCentroDistribucion(cd);
        nuevo.setProducto(producto);
        nuevo.setCantidad(datos.getCantidad());

        inventarioRepository.save(nuevo);

        return "Producto agregado al inventario correctamente";
    }

    public List<Inventario> listarInventarioCD(Integer centroId, String username, boolean esAdmin){
        Optional<CentroDistribucion> cdOpt = centroRepository.findById(centroId);

        if(cdOpt.isEmpty()){
            return List.of();
        }

        CentroDistribucion cd = cdOpt.get();

        if(!esAdmin && (cd.getEncargado() == null || !username.equals(cd.getEncargado().getUsername()))){
            return List.of();
        }

        return inventarioRepository.findByCentroDistribucionId(cd.getId());
    }
}
