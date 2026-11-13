-- HUS03: trazabilidad de movimientos de inventario y ventas
-- Agrega la columna con el usuario que hizo cada movimiento.
-- Es nullable porque los movimientos anteriores no tienen usuario registrado.
ALTER TABLE movimiento_inventario
    ADD COLUMN IF NOT EXISTS usuario VARCHAR(255);