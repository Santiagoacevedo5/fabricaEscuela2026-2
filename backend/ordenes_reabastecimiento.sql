-- Ejecutar solo si estas tablas aún no existen en la base de datos.
CREATE TABLE IF NOT EXISTS orden_reabastecimiento (
    id BIGSERIAL PRIMARY KEY,
    tienda_id INTEGER NOT NULL REFERENCES tienda (id),
    estado VARCHAR(30) NOT NULL
        CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada', 'Enviada', 'Recibida')),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orden_item (
    id BIGSERIAL PRIMARY KEY,
    orden_id BIGINT NOT NULL REFERENCES orden_reabastecimiento (id),
    producto_id BIGINT NOT NULL REFERENCES producto (id_producto),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0)
);
