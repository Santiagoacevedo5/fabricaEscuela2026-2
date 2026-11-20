-- HU7.1 y HU7.2: auditoría de las órdenes de reabastecimiento
-- Las tres columnas son nullable: las órdenes ya existentes no tienen estos datos,
-- y una orden recién creada aún no tiene revisor, fecha de revisión ni motivo.
-- revisado_por y fecha_revision se llenan al aprobar o rechazar; motivo_rechazo, solo al rechazar.

ALTER TABLE orden_reabastecimiento
    ADD COLUMN IF NOT EXISTS revisado_por VARCHAR(255),
    ADD COLUMN IF NOT EXISTS fecha_revision TIMESTAMP,
    ADD COLUMN IF NOT EXISTS motivo_rechazo VARCHAR(500);