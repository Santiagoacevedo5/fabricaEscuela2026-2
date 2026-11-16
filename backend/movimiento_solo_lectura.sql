-- HUS03: el historial de movimientos de inventario y ventas es de solo lectura.
-- Este trigger rechaza cualquier UPDATE o DELETE sobre la tabla, venga de donde venga
-- (el backend, el editor de Supabase o una conexión directa a la base).
-- Los INSERT siguen funcionando normalmente.

CREATE OR REPLACE FUNCTION bloquear_cambios_movimiento()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Los movimientos de inventario son de solo lectura: no se pueden editar ni eliminar (HUS03)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS movimiento_solo_lectura ON movimiento_inventario;

CREATE TRIGGER movimiento_solo_lectura
    BEFORE UPDATE OR DELETE ON movimiento_inventario
FOR EACH ROW
EXECUTE FUNCTION bloquear_cambios_movimiento();