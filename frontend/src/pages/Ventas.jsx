import { useEffect, useRef, useState } from 'react'

const API = import.meta.env.VITE_API_URL
const FORM_INICIAL = { tiendaId: '', inventarioId: '', cantidad: '', fecha: '' }
const tokenHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })
const hoyLocal = () => {
  const fecha = new Date()
  return [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, '0'), String(fecha.getDate()).padStart(2, '0')].join('-')
}
const fechaISO = fecha => [
  fecha.getFullYear(),
  String(fecha.getMonth() + 1).padStart(2, '0'),
  String(fecha.getDate()).padStart(2, '0'),
].join('-')
const formatearFecha = valor => valor
  ? `${valor.slice(8, 10)}-${valor.slice(5, 7)}-${valor.slice(0, 4)}`
  : ''
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function FiltroFecha({ value, onChange, maxDate, fullWidth = false, sidePopup = false, id }) {
  const [abierto, setAbierto] = useState(false)
  const [posicionPopup, setPosicionPopup] = useState(null)
  const [mesVisible, setMesVisible] = useState(() => {
    const hoy = new Date()
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })
  const contenedorRef = useRef(null)
  const hoy = hoyLocal()
  const inicioMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1)
  const desplazamiento = (inicioMes.getDay() + 6) % 7
  const dias = Array.from({ length: 42 }, (_, indice) => {
    const fecha = new Date(inicioMes)
    fecha.setDate(indice - desplazamiento + 1)
    return fecha
  })

  useEffect(() => {
    if (!abierto) return undefined
    const cerrarAlHacerClickAfuera = evento => {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false)
    }
    const cerrarConEscape = evento => {
      if (evento.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', cerrarAlHacerClickAfuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('mousedown', cerrarAlHacerClickAfuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto])

  const cambiarMes = delta => setMesVisible(mes => new Date(mes.getFullYear(), mes.getMonth() + delta, 1))
  const abrirPopup = () => {
    if (sidePopup && contenedorRef.current) {
      const rect = contenedorRef.current.getBoundingClientRect()
      const margen = 16
      const anchoPopup = Math.min(260, window.innerWidth - margen * 2)
      const leftDerecha = rect.right + 8
      const leftIzquierda = rect.left - anchoPopup - 8
      const leftPreferido = leftDerecha + anchoPopup <= window.innerWidth - margen
        ? leftDerecha
        : leftIzquierda >= margen
          ? leftIzquierda
          : rect.left
      const left = Math.max(margen, Math.min(leftPreferido, window.innerWidth - margen - anchoPopup))
      const top = Math.max(margen, Math.min(rect.top, window.innerHeight - margen - 340))
      setPosicionPopup({ left, top })
    }
    setAbierto(actual => !actual)
  }

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'shrink-0'}`} ref={contenedorRef}>
      <div className={`${fullWidth ? 'flex w-full h-10' : 'inline-flex w-fit h-[38px] shrink-0'} items-center overflow-hidden rounded-lg border bg-white ${
        abierto ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
      }`}>
        <button
          type="button"
          id={id}
          aria-label="Elegir fecha"
          aria-haspopup="dialog"
          aria-expanded={abierto}
          onClick={abrirPopup}
          className={`flex h-full items-center gap-1 px-3 text-left text-sm text-slate-700 ${fullWidth ? 'flex-1 justify-start' : 'flex-none'}`}
        >
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
          </svg>
          <span className={value ? 'text-slate-700' : 'text-slate-400'}>{formatearFecha(value) || 'dd-mm-yyyy'}</span>
        </button>
        <button
          type="button"
          aria-label="Limpiar fecha"
          disabled={!value}
          onClick={() => onChange('')}
          className={`flex h-full w-8 shrink-0 items-center justify-center text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 ${
            value ? '' : 'invisible'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {abierto && (
        <div
          role="dialog"
          aria-label="Seleccionar fecha"
          style={sidePopup ? {
            position: 'fixed',
            left: posicionPopup?.left,
            top: posicionPopup?.top,
            width: 'min(260px, calc(100vw - 2rem))',
            maxHeight: 'calc(100vh - 2rem)',
          } : undefined}
          className={`${sidePopup ? 'z-[60] overflow-y-auto p-3' : 'absolute right-0 z-30 mt-2 p-4'} w-[292px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10`}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => cambiarMes(-1)}
              className={`flex items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 ${sidePopup ? 'h-7 w-7' : 'h-8 w-8'}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <p className="text-sm font-semibold capitalize text-slate-800">
              {mesVisible.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
            </p>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => cambiarMes(1)}
              className={`flex items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 ${sidePopup ? 'h-7 w-7' : 'h-8 w-8'}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {DIAS_SEMANA.map(dia => (
              <span key={dia} aria-hidden="true" className="py-1.5 text-center text-xs font-medium text-slate-400">{dia}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {dias.map(fecha => {
              const valor = fechaISO(fecha)
              const delMes = fecha.getMonth() === mesVisible.getMonth()
              const seleccionado = valor === value
              const esHoy = valor === hoy
              const deshabilitado = maxDate && valor > maxDate
              return (
                <button
                  key={valor}
                  type="button"
                  disabled={deshabilitado}
                  aria-label={fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  aria-pressed={seleccionado}
                  onClick={() => {
                    onChange(valor)
                    setAbierto(false)
                  }}
                  className={`mx-auto flex items-center justify-center rounded-lg text-sm transition-colors disabled:cursor-not-allowed disabled:text-slate-200 ${sidePopup ? 'h-8 w-8' : 'h-9 w-9'} ${
                    seleccionado
                      ? 'bg-[#1e3a5f] font-semibold text-white'
                      : delMes
                        ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                        : 'text-slate-300 hover:bg-slate-50'
                  } ${esHoy && !seleccionado ? 'font-semibold ring-1 ring-inset ring-blue-300' : ''}`}
                >
                  {fecha.getDate()}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setAbierto(false)
              }}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              Limpiar
            </button>
            <button
              type="button"
              disabled={Boolean(maxDate && hoy > maxDate)}
              onClick={() => {
                const hoyDate = new Date()
                setMesVisible(new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1))
                onChange(hoy)
                setAbierto(false)
              }}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Ventas() {
  const [inventarios, setInventarios] = useState([])
  const [tiendas, setTiendas] = useState([])
  const [ventas, setVentas] = useState([])
  const [form, setForm] = useState(FORM_INICIAL)
  const [filtros, setFiltros] = useState({ busqueda: '', tiendaId: '', fecha: '' })
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [errorModal, setErrorModal] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        const headers = tokenHeaders()
        const [resInv, resTiendas, resVentas] = await Promise.all([
          fetch(`${API}/api/inventario`, { headers }),
          fetch(`${API}/api/tiendas`, { headers }),
          fetch(`${API}/api/inventario/movimientos`, { headers }),
        ])
        if (!resInv.ok || !resTiendas.ok || !resVentas.ok) {
          throw new Error('No se pudieron cargar inventario, tiendas o ventas. Verifica tu sesión.')
        }
        const [inventarioData, tiendasData, movimientosData] = await Promise.all([
          resInv.json(),
          resTiendas.json(),
          resVentas.json(),
        ])
        setInventarios(inventarioData)
        setTiendas(tiendasData)
        setVentas(movimientosData
          .filter(movimiento => movimiento.tipo === 'VENTA')
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
      } catch (err) {
        setError(err.message || 'No se pudieron cargar las ventas.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const inventariosTienda = inventarios.filter(inv => inv.tienda?.id === Number(form.tiendaId))
  const ventasFiltradas = ventas.filter(venta => {
    const producto = venta.inventario?.producto?.nombre ?? ''
    const tienda = venta.inventario?.tienda?.nombre ?? ''
    const busqueda = filtros.busqueda.trim().toLocaleLowerCase('es')
    return (!busqueda || producto.toLocaleLowerCase('es').includes(busqueda) || tienda.toLocaleLowerCase('es').includes(busqueda))
      && (!filtros.tiendaId || String(venta.inventario?.tienda?.id) === filtros.tiendaId)
      && (!filtros.fecha || venta.fecha?.slice(0, 10) === filtros.fecha)
  })

  const abrirModal = () => {
    setForm({ ...FORM_INICIAL, fecha: hoyLocal() })
    setErrorModal('')
    setMensaje('')
    setModalAbierto(true)
  }

  const cerrarModal = () => setModalAbierto(false)

  const cambiarTienda = (e) => {
    setForm(prev => ({ ...prev, tiendaId: e.target.value, inventarioId: '' }))
    setError('')
  }

  const registrarVenta = async (e) => {
    e.preventDefault()
    setErrorModal('')
    setMensaje('')

    const cantidad = Number(form.cantidad)
    const inventario = inventariosTienda.find(inv => inv.id === Number(form.inventarioId))
    if (!form.tiendaId || !inventario || !form.fecha || !Number.isInteger(cantidad) || cantidad <= 0) {
      setErrorModal('Selecciona una tienda, un producto, una cantidad entera mayor que cero y una fecha.')
      return
    }
    if (form.fecha > hoyLocal()) {
      setErrorModal('La fecha de la venta no puede ser futura.')
      return
    }
    if (cantidad > inventario.cantidad) {
      setErrorModal(`Solo hay ${inventario.cantidad} unidades disponibles.`)
      return
    }

    setGuardando(true)
    try {
      const respuesta = await fetch(`${API}/api/inventario/ventas`, {
        method: 'POST',
        headers: { ...tokenHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventario: { id: inventario.id },
          tipo: 'VENTA',
          cantidad,
          fecha: `${form.fecha}T${new Date().toTimeString().slice(0, 8)}`,
        }),
      })
      if (!respuesta.ok) {
        setErrorModal((await respuesta.text()) || 'No se pudo registrar la venta.')
        return
      }

      const venta = await respuesta.json()
      setVentas(prev => [venta, ...prev].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
      setInventarios(prev => prev.map(inv => inv.id === inventario.id
        ? { ...inv, cantidad: inv.cantidad - cantidad }
        : inv))
      cerrarModal()
      setMensaje('Venta registrada correctamente.')
    } catch {
      setErrorModal('No se pudo conectar con el servidor.')
    } finally {
      setGuardando(false)
    }
  }

  const etiqueta = 'block text-sm font-medium text-slate-700 mb-1.5'
  const campo = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10'

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Ventas</h1>
            <p className="mt-0.5 text-sm text-slate-500">Registra ventas de tienda y consulta su historial.</p>
          </div>
          <button onClick={abrirModal} className="data-table-primary-button">
            + Registrar venta
          </button>
        </div>

        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {mensaje && <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{mensaje}</div>}

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-48 flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              aria-label="Buscar producto o tienda"
              value={filtros.busqueda}
              onChange={e => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              placeholder="Buscar por producto o tienda..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
            <select
              aria-label="Filtrar por tienda"
              value={filtros.tiendaId}
              onChange={e => setFiltros(prev => ({ ...prev, tiendaId: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las tiendas</option>
              {tiendas.map(tienda => <option key={tienda.id} value={tienda.id}>{tienda.nombre}</option>)}
            </select>
            <FiltroFecha
              value={filtros.fecha}
              onChange={fecha => setFiltros(prev => ({ ...prev, fecha }))}
            />
        </div>

        <div className="data-table-card">
          <div className="data-table-scroll">
          <table className="data-table">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th>Fecha y hora</th>
                <th>Tienda</th>
                <th>Producto</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.map(venta => (
                <tr key={venta.id} className="border-b border-slate-100 last:border-0">
                  <td>{new Date(venta.fecha).toLocaleString('es-CO')}</td>
                  <td>{venta.inventario?.tienda?.nombre ?? '—'}</td>
                  <td className="font-medium text-slate-900">{venta.inventario?.producto?.nombre ?? '—'}</td>
                  <td>{venta.cantidad}</td>
                </tr>
              ))}
              {!cargando && ventasFiltradas.length === 0 && (
                <tr><td colSpan={4}>
                  {ventas.length ? 'No hay ventas que coincidan con los filtros.' : 'Aún no hay ventas registradas.'}
                </td></tr>
              )}
              {cargando && (
                <tr><td colSpan={4}>Cargando ventas...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Registrar venta</h2>
              <button type="button" onClick={cerrarModal} aria-label="Cerrar" className="text-2xl leading-none text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={registrarVenta} className="space-y-4 px-6 py-5">
              {errorModal && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{errorModal}</div>}
              <div>
                <label htmlFor="venta-tienda" className={etiqueta}>Tienda</label>
                <select id="venta-tienda" required value={form.tiendaId} onChange={cambiarTienda} className={campo}>
                  <option value="">Selecciona una tienda</option>
                  {tiendas.map(tienda => <option key={tienda.id} value={tienda.id}>{tienda.nombre}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="venta-producto" className={etiqueta}>Producto</label>
                <select
                  id="venta-producto"
                  required
                  value={form.inventarioId}
                  onChange={e => setForm(prev => ({ ...prev, inventarioId: e.target.value }))}
                  disabled={!form.tiendaId}
                  className={campo}
                >
                  <option value="">Selecciona un producto</option>
                  {inventariosTienda.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.producto.identificador} - {inv.producto.nombre} (disponible: {inv.cantidad})</option>
                  ))}
                </select>
                {form.tiendaId && inventariosTienda.length === 0 && (
                  <p className="mt-1.5 text-xs text-slate-500">Esta tienda no tiene productos en inventario.</p>
                )}
              </div>
              <div>
                <label htmlFor="venta-cantidad" className={etiqueta}>Cantidad</label>
                <input id="venta-cantidad" required type="number" min="1" step="1" value={form.cantidad} onChange={e => setForm(prev => ({ ...prev, cantidad: e.target.value }))} placeholder="0" className={campo} />
              </div>
              <div>
                <label htmlFor="venta-fecha" className={etiqueta}>Fecha</label>
                <FiltroFecha
                  id="venta-fecha"
                  value={form.fecha}
                  onChange={fecha => setForm(prev => ({ ...prev, fecha }))}
                  maxDate={hoyLocal()}
                  fullWidth
                  sidePopup
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={guardando} className="rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#254a75] disabled:opacity-60">
                  {guardando ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
