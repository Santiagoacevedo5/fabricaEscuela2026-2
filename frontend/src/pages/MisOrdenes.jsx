import { useEffect, useState } from 'react'
import { misOrdenes, detalleMiOrden, confirmarRecepcion } from '../ordenesApi'

// HU7.3: el encargado de tienda sigue el estado de las ordenes de reabastecimiento de SU tienda.
// La tienda la decide el backend a partir del token; aqui nunca se envia.

const colores = {
    Pendiente: 'bg-amber-100 text-amber-800',
    Aprobada: 'bg-blue-100 text-blue-800',
    Rechazada: 'bg-red-100 text-red-700',
    Enviada: 'bg-violet-100 text-violet-700',
    Recibida: 'bg-green-100 text-green-800',
}

function Estado({ estado }) {
    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colores[estado] || 'bg-slate-100 text-slate-700'}`}>
            {estado}
        </span>
    )
}

const fecha = (f) =>
    f ? new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const hora = (f) =>
    f ? new Date(f).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''

const esAccesoDenegado = (err) => /403|No tienes acceso/i.test(err.message || '')

export default function MisOrdenes() {
    const [tienda, setTienda] = useState('')
    const [ordenes, setOrdenes] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')
    const [detalle, setDetalle] = useState(null)
    const [denegado, setDenegado] = useState(false)
    const [confirmando, setConfirmando] = useState(false)

    const cargar = () => {
        setCargando(true)
        return misOrdenes()
            .then((datos) => {
                setTienda(datos.tienda)
                setOrdenes(datos.ordenes)
                setError('')
            })
            .catch((err) => setError(err.message))
            .finally(() => setCargando(false))
    }

    useEffect(() => {
        cargar()
    }, [])

    // Escenarios 2 y 4
    const abrir = async (id) => {
        setExito('')
        try {
            setDetalle(await detalleMiOrden(id))
        } catch (err) {
            if (esAccesoDenegado(err)) setDenegado(true)
            else setError(err.message)
        }
    }

    // Escenario 3
    const confirmar = async () => {
        setConfirmando(true)
        try {
            const r = await confirmarRecepcion(detalle.id)
            setDetalle(null)
            setExito(`Recepción confirmada. El inventario de ${r.tienda} aumentó en ${r.unidades} unidades.`)
            await cargar()
        } catch (err) {
            setDetalle(null)
            setError(err.message)
        } finally {
            setConfirmando(false)
        }
    }

    if (denegado) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl">🔒</div>
                    <h2 className="text-xl font-semibold text-slate-900">Acceso denegado</h2>
                    <p className="mb-5 text-sm text-slate-500">No tienes acceso a esta orden</p>
                    <button
                        className="rounded-lg bg-[#1e3a5f] px-5 py-2 text-sm font-semibold text-white"
                        onClick={() => setDenegado(false)}
                    >
                        Volver a mis órdenes
                    </button>
                </div>
            </div>
        )
    }

    const th = 'px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500'

    return (
        <div className="p-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Mis órdenes</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {tienda ? `Órdenes de reabastecimiento para ${tienda}` : 'Órdenes de reabastecimiento'}
                    </p>
                </div>

                {exito && (
                    <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
                        ✓ {exito}
                    </div>
                )}
                {error && (
                    <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className={th}>Orden</th>
                                <th className={th}>Productos</th>
                                <th className={th}>Fecha de creación</th>
                                <th className={th}>Estado</th>
                                <th className={th}>Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargando ? (
                                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">Cargando...</td></tr>
                            ) : ordenes.length === 0 ? (
                                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">Tu tienda no tiene órdenes</td></tr>
                            ) : (
                                ordenes.map((o) => (
                                    <tr key={o.id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-5 py-3.5 text-sm font-medium text-slate-900">#{o.id}</td>
                                        <td className="px-5 py-3.5 text-sm text-slate-900">
                                            {o.productos} {o.productos === 1 ? 'producto' : 'productos'}
                                            <div className="text-xs text-slate-400">{o.unidades} unidades</div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-900">
                                            {fecha(o.fechaCreacion)}
                                            <div className="text-xs text-slate-400">{hora(o.fechaCreacion)}</div>
                                        </td>
                                        <td className="px-5 py-3.5"><Estado estado={o.estado} /></td>
                                        <td className="px-5 py-3.5">
                                            <button className="text-sm text-slate-600 hover:underline" onClick={() => abrir(o.id)}>
                                                Ver detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
                        {ordenes.length} órdenes de tu tienda
                    </p>
                </div>
            </div>

            {detalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Detalle de orden #{detalle.id}</h2>
                            <button onClick={() => setDetalle(null)} aria-label="Cerrar" className="text-slate-400 hover:text-slate-700">✕</button>
                        </div>

                        <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <div className="text-xs uppercase text-slate-400">Tienda</div>
                                <div className="font-semibold text-slate-900">{detalle.tienda}</div>
                            </div>
                            <Estado estado={detalle.estado} />
                        </div>

                        <table className="mb-5 w-full overflow-hidden rounded-lg border border-slate-200">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="p-3 text-left">Producto</th>
                                    <th className="p-3 text-right">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detalle.productos.map((p, k) => (
                                    <tr key={k} className="border-t border-slate-100">
                                        <td className="p-3 text-sm text-slate-900">
                                            {p.producto}
                                            <div className="text-xs text-slate-400">{p.identificador}</div>
                                        </td>
                                        <td className="p-3 text-right text-sm font-semibold text-slate-900">{p.cantidad} unidades</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <h3 className="mb-2 font-semibold text-slate-900">Historial de estados</h3>
                        <ul className="mb-5 space-y-3">
                            {detalle.historial.map((h, k) => (
                                <li key={k} className="flex gap-3">
                                    <span className={`mt-1.5 h-3 w-3 rounded-full ${k === detalle.historial.length - 1 ? 'bg-blue-600' : 'bg-slate-300'}`} />
                                    <div>
                                        <div className="text-sm text-slate-900">{h.estado}</div>
                                        <div className="text-xs text-slate-400">
                                            {fecha(h.fecha)} · {hora(h.fecha)}{h.usuario ? ` · ${h.usuario}` : ''}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {detalle.estado === 'Enviada' && (
                            <div className="text-right">
                                <button
                                    disabled={confirmando}
                                    onClick={confirmar}
                                    className="rounded-lg bg-[#1e3a5f] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {confirmando ? 'Confirmando...' : 'Confirmar recepción'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
