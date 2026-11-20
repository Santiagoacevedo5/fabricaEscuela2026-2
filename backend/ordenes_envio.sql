-- Task 135: auditoría del envío de órdenes

ALTER TABLE orden_reabastecimiento
    ADD COLUMN IF NOT EXISTS enviado_por VARCHAR(255),
    ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMP;