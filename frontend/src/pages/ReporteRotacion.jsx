import { useEffect, useState } from 'react'

// HU8.1: Reporte de rotación de productos (solo admin).
const API = import.meta.env.VITE_API_URL

// Fecha local en formato AAAA-MM-DD (toISOString usaría UTC y en la noche daría el día siguiente)
const fechaLocal = (fecha) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`

const hoy = new Date()
const PRIMER_DIA_MES = fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
const HOY = fechaLocal(hoy)

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

// Escenario 4: descarga el reporte tal como se ve en pantalla en CSV (Excel lo abre directo)
const exportarCsv = (reporte) => {
    const celda = (v) => `"${String(v).replace(/"/g, '""')}"`
    const filas = [
        ['Producto', 'Identificador', 'Categoría', 'Unidades vendidas', 'Stock actual', 'Rotación'],
        ...reporte.productos.map((p) => [
            p.nombre, p.identificador, p.categoria, p.unidades, p.stock, p.sinRotacion ? 'Sin rotación' : p.rotacion,
        ]),
    ]
    // BOM para que Excel respete las tildes
    const csv = '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `rotacion_${reporte.desde}_${reporte.hasta}.csv`
    enlace.click()
    URL.revokeObjectURL(url)
}

export default function ReporteRotacion() {
    const [tiendas, setTiendas] = useState([])
    const [tiendaId, setTiendaId] = useState('')
    const [desde, setDesde] = useState(PRIMER_DIA_MES)
    const [hasta, setHasta] = useState(HOY)
    const [reporte, setReporte] = useState(null)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    // Tiendas para el filtro opcional (el admin ve todas)
    useEffect(() => {
        fetch(`${API}/api/demanda/tiendas`, { headers: headers() })
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`)
                return res.json()
            })
            .then(setTiendas)
            .catch((err) => setError(err.message))
    }, [])

    const generar = (e) => {
        e.preventDefault()
        // Escenario 3: rango inválido, no se genera el reporte (el backend también lo valida)
        if (!desde || !hasta) {
            setError('Selecciona la fecha de inicio y la fecha de fin.')
            setReporte(null)
            return
        }
        if (desde > hasta) {
            setError('La fecha de inicio no puede ser posterior a la fecha de fin.')
            setReporte(null)
            return
        }
        setCargando(true)
        setError('')
        const tienda = tiendaId ? `&tiendaId=${tiendaId}` : ''
        fetch(`${API}/api/reportes/rotacion?desde=${desde}&hasta=${hasta}${tienda}`, { headers: headers() })
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`)
                return res.json()
            })
            .then(setReporte)
            .catch((err) => {
                setError(err.message)
                setReporte(null)
            })
            .finally(() => setCargando(false))
    }

    const inputClase =
        'w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300'
    const thClase = 'px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide'

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Rotación de productos</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Rotación = unidades vendidas / inventario promedio del periodo (stock actual + vendidas / 2)
                    </p>
                </div>

                <form
                    onSubmit={generar}
                    className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                >
                    <div>
                        <label htmlFor="rot-desde" className="block text-sm text-slate-600 mb-1.5">Fecha de inicio</label>
                        <input id="rot-desde" type="date" value={desde} max={HOY} onChange={(e) => setDesde(e.target.value)} className={inputClase} />
                    </div>
                    <div>
                        <label htmlFor="rot-hasta" className="block text-sm text-slate-600 mb-1.5">Fecha de fin</label>
                        <input id="rot-hasta" type="date" value={hasta} max={HOY} onChange={(e) => setHasta(e.target.value)} className={inputClase} />
                    </div>
                    <div>
                        <label htmlFor="rot-tienda" className="block text-sm text-slate-600 mb-1.5">Tienda (opcional)</label>
                        <select id="rot-tienda" value={tiendaId} onChange={(e) => setTiendaId(e.target.value)} className={inputClase}>
                            <option value="">Todas las tiendas</option>
                            {tiendas.map((t) => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={cargando}
                        className="bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-slate-800 disabled:opacity-50"
                    >
                        {cargando ? 'Generando...' : 'Generar reporte'}
                    </button>
                </form>

                {error && (
                    <div role="alert" className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                        {error}
                    </div>
                )}

                {reporte && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                            <p className="text-sm text-slate-600">
                                {reporte.tienda} · {reporte.desde} a {reporte.hasta}
                            </p>
                            <button
                                type="button"
                                onClick={() => exportarCsv(reporte)}
                                disabled={reporte.productos.length === 0}
                                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Exportar CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className={thClase}>Producto</th>
                                    <th className={thClase}>Unidades vendidas</th>
                                    <th className={thClase}>Stock actual</th>
                                    <th className={thClase}>Rotación</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reporte.productos.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">
                                            No hay productos registrados
                                        </td>
                                    </tr>
                                ) : (
                                    reporte.productos.map((p) => (
                                        <tr key={p.idProducto} className="border-b border-slate-100 last:border-0">
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm text-slate-900">{p.nombre}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{p.identificador}</p>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{p.unidades}</td>
                                            <td className="px-5 py-3.5 text-sm text-slate-700">{p.stock}</td>
                                            <td className="px-5 py-3.5 text-sm">
                                                {p.sinRotacion ? (
                                                    <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                                                        Sin rotación
                                                    </span>
                                                ) : (
                                                    <span className="font-semibold text-slate-900">{p.rotacion}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
