export const fechaDdMmYyyy = (fecha) => {
  if (!fecha) return ''
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return `${dia}-${mes}-${anio}`
}

export const fechaIsoDesdeDdMmYyyy = (fecha) => {
  const coincidencia = /^(\d{2})-(\d{2})-(\d{4})$/.exec(fecha)
  if (!coincidencia) return ''
  const [, dia, mes, anio] = coincidencia
  const iso = `${anio}-${mes}-${dia}`
  const parsed = new Date(`${iso}T00:00:00`)
  return parsed.getFullYear() === Number(anio)
    && parsed.getMonth() + 1 === Number(mes)
    && parsed.getDate() === Number(dia)
    ? iso
    : ''
}
