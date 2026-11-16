import { useEffect, useState } from 'react'

// HU5.1: Demanda por tienda (admin y encargado de CD).
// Qué tiendas aparecen lo decide el backend a partir del token (/api/demanda/tiendas).
const API = import.meta.env.VITE_API_URL

// Fecha local en formato AAAA-MM-DD (toISOString usaría UTC y en la noche daría el día siguiente)
const fechaLocal = (fecha) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`

const hoy = new Date()
const PRIMER_DIA_MES = fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
const HOY = fechaLocal(hoy)

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

const IconoGrafica = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20V10m5 10V4m5 16v-7m5 7V8" />
    </svg>
)

export default function Demanda({ esAdmin }) {
    const [tiendas, setTiendas] = useState([])
    const [tiendaId, setTiendaId] = useState('')
    const [desde, setDesde] = useState(PRIMER_DIA_MES)
    const [hasta, setHasta] = useState(HOY)
    const [productos, setProductos] = useState([])
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const [cargandoTiendas, setCargandoTiendas] = useState(true)
    // Tarea 117: ventana de comparación entre tiendas (null = cerrada)
    const [comparacion, setComparacion] = useState(null)

    // 1. Tiendas que puede consultar el usuario (la primera queda seleccionada)
    useEffect(() => {
        fetch(`${API}/api/demanda/tiendas`, { headers: headers() })
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`)
                return res.json()
            })
            .then((data) => {
                setTiendas(data)
                if (data.length > 0) setTiendaId(String(data[0].id))
            })
            .catch((err) => setError(err.message))
            .finally(() => setCargandoTiendas(false))
    }, [])

    // 2. Demanda de la tienda elegida en el rango de fechas (se recalcula al cambiar un filtro)
    useEffect(() => {
        if (!tiendaId || !desde || !hasta) return
        if (desde > hasta) {
            setError('La fecha de inicio no puede ser posterior a la fecha de fin.')
            setProductos([])
            setMensaje('')
            return
        }

        let cancelado = false
        setCargando(true)
        setError('')
        fetch(`${API}/api/demanda?tiendaId=${tiendaId}&desde=${desde}&hasta=${hasta}`, { headers: headers() })
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`)
                return res.json()
            })
            .then((data) => {
                if (cancelado) return
                setProductos(data.productos || [])
                setMensaje(data.mensaje || '')
            })
            .catch((err) => {
                if (cancelado) return
                setError(err.message)
                setProductos([])
                setMensaje('')
            })
            .finally(() => {
                if (!cancelado) setCargando(false)
            })
        return () => { cancelado = true }
    }, [tiendaId, desde, hasta])

    // Escenario 3: unidades vendidas de un producto en cada tienda, con el mismo rango de fechas
    const abrirComparacion = (producto) => {
        setComparacion({ producto, tiendas: [], cargando: true, error: '' })
        fetch(`${API}/api/demanda/comparar?productoId=${producto.idProducto}&desde=${desde}&hasta=${hasta}`, { headers: headers() })
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`)
                return res.json()
            })
            .then((data) => setComparacion({ producto, tiendas: data.tiendas || [], cargando: false, error: '' }))
            .catch((err) => setComparacion({ producto, tiendas: [], cargando: false, error: err.message }))
    }

    // La barra de "demanda relativa" se mide contra el producto más vendido
    const maximo = Math.max(1, ...productos.map((p) => p.unidades))

    const inputClase =
        'w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300'

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* ENCABEZADO */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Demanda por tienda</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {esAdmin
                            ? 'Analiza las unidades vendidas por producto en cada tienda'
                            : 'Analiza las unidades vendidas por producto en las tiendas de tu centro de distribución'}
                    </p>
                </div>

                {/* FILTROS */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1.5">Tienda</label>
                        <select
                            value={tiendaId}
                            onChange={(e) => setTiendaId(e.target.value)}
                            disabled={tiendas.length === 0}
                            className={inputClase}
                        >
                            {tiendas.length === 0 && (
                                <option value="">{cargandoTiendas ? 'Cargando tiendas...' : 'Sin tiendas asignadas'}</option>
                            )}
                            {tiendas.map((t) => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1.5">Fecha de inicio</label>
                        <input type="date" value={desde} max={HOY} onChange={(e) => setDesde(e.target.value)} className={inputClase} />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1.5">Fecha de fin</label>
                        <input type="date" value={hasta} max={HOY} onChange={(e) => setHasta(e.target.value)} className={inputClase} />
                    </div>
                </div>

                {error && (
                    <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                        {error}
                    </div>
                )}

                {/* TABLA */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unidades vendidas</th>
                                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Demanda relativa</th>
                                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Comparación</th>
                            </tr>
                            </thead>
                            <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">
                                        Cargando demanda...
                                    </td>
                                </tr>
                            ) : productos.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-14">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <IconoGrafica className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm text-slate-700">
                                                {mensaje || (tiendas.length === 0 && !cargandoTiendas
                                                    ? 'No tienes tiendas para consultar'
                                                    : 'No hay ventas registradas en este periodo')}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                productos.map((p) => (
                                    <tr key={p.idProducto} className="border-b border-slate-100 last:border-0">
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm text-slate-900">{p.nombre}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{p.identificador}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{p.unidades}</td>
                                        <td className="px-5 py-3.5 w-1/3">
                                            <div className="h-2 w-full rounded-full bg-slate-100">
                                                <div
                                                    className="h-2 rounded-full bg-blue-600"
                                                    style={{ width: `${(p.unidades / maximo) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <button
                                                type="button"
                                                onClick={() => abrirComparacion(p)}
                                                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                                            >
                                                <IconoGrafica className="w-4 h-4" />
                                                Comparar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                        {productos.length} {productos.length === 1 ? 'producto con ventas' : 'productos con ventas'}
                    </div>
                </div>
            </div>

            {/* VENTANA DE COMPARACIÓN (tarea 117) */}
            {comparacion && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
                    onClick={() => setComparacion(null)}
                >
                    <div
                        className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h2 className="text-base font-semibold text-slate-900">
                                Comparación · {comparacion.producto.nombre}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setComparacion(null)}
                                aria-label="Cerrar"
                                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-sm text-slate-500 mb-4">
                                Unidades vendidas por tienda entre {desde} y {hasta}
                            </p>

                            {comparacion.cargando && (
                                <p className="text-sm text-slate-400 py-6 text-center">Cargando comparación...</p>
                            )}

                            {comparacion.error && (
                                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                                    {comparacion.error}
                                </div>
                            )}

                            {!comparacion.cargando && !comparacion.error && (() => {
                                const maxTienda = Math.max(1, ...comparacion.tiendas.map((t) => t.unidades))
                                return (
                                    <div className="space-y-4">
                                        {comparacion.tiendas.map((t) => (
                                            <div key={t.tiendaId}>
                                                <div className="flex items-end justify-between mb-1.5">
                                                    <div>
                                                        <p className="text-sm text-slate-900">{t.tienda}</p>
                                                        {t.region && <p className="text-xs text-slate-400">{t.region}</p>}
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {t.unidades} {t.unidades === 1 ? 'unidad' : 'unidades'}
                                                    </p>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-slate-100">
                                                    <div
                                                        className="h-2 rounded-full bg-blue-600"
                                                        style={{ width: `${(t.unidades / maxTienda) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}