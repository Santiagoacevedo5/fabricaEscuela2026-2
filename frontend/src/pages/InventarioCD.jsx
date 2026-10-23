import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

// /api/inventario-cd/** exige sesión: el backend identifica al usuario por el token
const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
})

// Consulta del inventario de un CD. Los productos ya no se agregan desde aquí:
// entran al CD con "Registrar entrada" (Inventario), que valida la capacidad del CD.
export default function InventarioCD({ centro, onVolver }) {
    const [items, setItems] = useState([])
    const [cargando, setCargando] = useState(true)
    const [errorCarga, setErrorCarga] = useState('')

    // Solo "ACTIVO" cuenta como activo (un estado nulo se trata como inactivo)
    const activo = centro.estado === 'ACTIVO'

    const cargarInventario = async () => {
        try {
            const res = await fetch(`${API}/api/inventario-cd/${centro.id}`, { headers: headers() })
            if (!res.ok) {
                setErrorCarga('No se pudo cargar el inventario. Si la sesión venció, cierra sesión y vuelve a entrar.')
                return
            }
            setItems(await res.json())
            setErrorCarga('')
        } catch {
            setErrorCarga('No se pudo conectar con el servidor. Verifica que el backend esté encendido.')
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargarInventario()
    }, [centro.id])

    return (
        <div className="mx-auto w-full max-w-7xl p-6 md:p-8">
            <button onClick={onVolver} className="text-sm text-slate-600 hover:text-slate-900 mb-3">
                ← Volver a Centros de Distribución
            </button>

            {/* Encabezado */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900">Inventario - {centro.nombre}</h1>
            </div>

            {!activo && (
                <div className="p-3 mb-4 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
                    Este centro de distribución está inactivo.
                </div>
            )}

            {errorCarga && (
                <div className="p-3 mb-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                    {errorCarga}
                </div>
            )}

            {/* Tabla */}
            <div className="data-table-card">
                <div className="data-table-scroll">
                    <table className="data-table">
                        <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                            {['ID', 'Nombre del producto', 'Cantidad disponible'].map(h => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap border-b border-slate-200"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {!cargando && items.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-400">
                                    Este centro aún no tiene productos en su inventario.
                                </td>
                            </tr>
                        ) : (
                            items.map(i => (
                                <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                                        {i.producto?.identificador ?? i.producto?.idProducto}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{i.producto?.nombre}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                        {i.cantidad}
                                        {i.cantidad === 0 && (
                                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                Sin existencias
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
                    {items.length} productos en inventario
                </div>
            </div>
        </div>
    )
}