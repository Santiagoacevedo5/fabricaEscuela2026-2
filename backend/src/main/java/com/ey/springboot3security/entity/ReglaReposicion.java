// Ruta: src/main/java/com/ey/springboot3security/entity/ReglaReposicion.java
package com.ey.springboot3security.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "reglas_reposicion",
        uniqueConstraints = @UniqueConstraint(columnNames = {"producto_id", "tienda_id"}))
public class ReglaReposicion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tienda_id")
    private Tienda tienda;

    @Column(nullable = false)
    private int umbralMinimo;

    @Column(nullable = false)
    private int cantidadReposicion;

    @Column(nullable = false)
    private boolean activa = true;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public Tienda getTienda() { return tienda; }
    public void setTienda(Tienda tienda) { this.tienda = tienda; }

    public int getUmbralMinimo() { return umbralMinimo; }
    public void setUmbralMinimo(int umbralMinimo) { this.umbralMinimo = umbralMinimo; }

    public int getCantidadReposicion() { return cantidadReposicion; }
    public void setCantidadReposicion(int cantidadReposicion) { this.cantidadReposicion = cantidadReposicion; }

    public boolean isActiva() { return activa; }
    public void setActiva(boolean activa) { this.activa = activa; }
}
