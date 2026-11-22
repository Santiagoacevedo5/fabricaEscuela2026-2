import { useEffect, useState } from 'react'
import { ubicacionesReporte, reporteInventario } from '../ordenesApi'

// HU8.2: reporte de niveles de inventario por tienda y centro de distribucion (solo admin).

const ESTADO = {
    'Disponible': 'bg-green-100 text-green-800',
    'Bajo stock': 'bg-amber-100 text-amber-800',
    'Sin existencias': 'bg-red-100 text-red-700',
}
const FILA = {
    'Bajo stock': 'bg-amber-50',
    'Sin existencias': 'bg-red-50',
}

// Escenario 4: descarga exactamente lo que se ve en pantalla (CSV, Excel lo abre directo)
const exportarCsv = (filas) => {
    const celda = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const datos = [
        ['Ubicación', 'Tipo', 'Producto', 'Identificador', 'Cantidad disponible', 'Estado'],
        ...filas.map((f) => [f.ubicacion, f.tipo, f.producto, f.identificador, f.cantidad, f.estado]),
    ]
    const csv = '﻿' + datos.map((r) => r.map(celda).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'niveles_inventario.csv'
    a.click()
    URL.revokeObjectURL(url)
}

export default function ReporteInventario() {
    const [ubicaciones, setUbicaciones] = useState([])
    const [ubicacion, setUbicacion] = useState('todas') // 'todas' | 'TIENDA-1' | 'CD-2'
    const [filas, setFilas] = useState(null) // null = aun no se genera
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        ubicacionesReporte().then(setUbicaciones).catch((err) => setError(err.message))
    }, [])

    // Escenarios 1 y 3
    const generar = (e) => {
        e.preventDefault()
        const u = ubicaciones.find((x) => `${x.tipo}-${x.id}` === ubicacion)
        setCargando(true)
        setError('')
        reporteInventario(u?.tipo, u?.id)
            .then(setFilas)
            .catch((err) => {
                setError(err.message)
                setFilas(null)
            })
            .finally(() => setCargando(false))
    }

    const inputClase =
        'w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300'
    const th = 'px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide'

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Niveles de inventario</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Detecta faltantes y excesos de stock por tienda y centro de distribución
                        </p>
                    </div>
                    {filas && (
                        <button
                            type="button"
                            onClick={() => exportarCsv(filas)}
                            disabled={filas.length === 0}
                            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            ⬇ Exportar
                        </button>
                    )}
                </div>

                <form
                    onSubmit={generar}
                    className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                    <div className="md:col-span-2">
                        <label htmlFor="inv-ubicacion" className="block text-sm text-slate-600 mb-1.5">Ubicación</label>
                        <select id="inv-ubicacion" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className={inputClase}>
                            <option value="todas">Todas las ubicaciones</option>
                            {ubicaciones.map((u) => (
                                <option key={`${u.tipo}-${u.id}`} value={`${u.tipo}-${u.id}`}>
                                    {u.nombre} ({u.tipo === 'CD' ? 'Centro de distribución' : 'Tienda'})
                                </option>
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

                {filas === null ? (
                    !error && (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                            Configura los filtros y genera el reporte.
                        </div>
                    )
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className={th}>Ubicación</th>
                                        <th className={th}>Producto</th>
                                        <th className={th}>Cantidad disponible</th>
                                        <th className={th}>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filas.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">
                                                Esta ubicación no tiene productos
                                            </td>
                                        </tr>
                                    ) : (
                                        filas.map((f, i) => (
                                            <tr key={i} className={`border-b border-slate-100 last:border-0 ${FILA[f.estado] || ''}`}>
                                                <td className="px-5 py-3.5 text-sm text-slate-900">
                                                    {f.ubicacion}
                                                    <div className="text-xs text-slate-400">{f.tipo}</div>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-slate-900">
                                                    {f.producto}
                                                    <div className="text-xs text-slate-400">{f.identificador}</div>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{f.cantidad}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO[f.estado]}`}>
                                                        {f.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
                            {filas.length} registros de inventario
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
