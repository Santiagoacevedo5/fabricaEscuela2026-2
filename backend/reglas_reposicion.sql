-- Reglas de reposición (correr una vez en Supabase; ddl-auto=validate no la crea)
CREATE TABLE IF NOT EXISTS reglas_reposicion (
    id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    tienda_id INTEGER NOT NULL,
    umbral_minimo INTEGER NOT NULL,
    cantidad_reposicion INTEGER NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_regla_producto FOREIGN KEY (producto_id) REFERENCES producto (id_producto),
    CONSTRAINT fk_regla_tienda FOREIGN KEY (tienda_id) REFERENCES tienda (id),
    CONSTRAINT uq_regla_producto_tienda UNIQUE (producto_id, tienda_id),
    CONSTRAINT ck_regla_valores CHECK (umbral_minimo > 0 AND cantidad_reposicion > 0)
);
