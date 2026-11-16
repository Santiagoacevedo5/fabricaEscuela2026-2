// Devuelve { campo: mensaje } con los campos inválidos; {} si la regla es válida
export function validarRegla(form) {
  const errores = {};
  if (!form.productoId) errores.productoId = 'Selecciona un producto.';
  if (!form.tiendaId) errores.tiendaId = 'Selecciona una tienda.';
  for (const campo of ['umbralMinimo', 'cantidadReposicion']) {
    const n = Number(form[campo]);
    if (!Number.isInteger(n) || n <= 0) errores[campo] = 'Debe ser un número entero mayor a 0.';
  }
  return errores;
}