-- HU5.1, escenario 4: acelera las consultas de demanda (ventas por rango de fechas)
CREATE INDEX IF NOT EXISTS idx_movimiento_tipo_fecha
    ON movimiento_inventario (tipo, fecha);

CREATE INDEX IF NOT EXISTS idx_movimiento_inventario_id
    ON movimiento_inventario (inventario_id);