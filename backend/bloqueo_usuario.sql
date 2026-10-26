-- HUS-01: tabla de auditoría de bloqueos por intentos fallidos (correr una vez en Supabase; ddl-auto=validate no la crea)
CREATE TABLE IF NOT EXISTS bloqueo_usuario (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    fecha TIMESTAMP NOT NULL
);
