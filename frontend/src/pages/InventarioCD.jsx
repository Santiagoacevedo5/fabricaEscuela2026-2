import { useState, useEffect } from 'react'
import Modal from '../components/Modal'

const API = import.meta.env.VITE_API_URL
const MENSAJE_OK = 'Producto agregado al inventario correctamente'

// /api/inventario-cd/** exige sesión: el backend identifica al encargado (o admin) por el token
const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
})

export default function InventarioCD({ centro, onVolver }) {
    const [items, setItems] = useState([])
    const [productos, setProductos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [errorCarga, setErrorCarga] = useState('')
    const [modalAbierto, setModalAbierto] = useState(false)
    const [productoId, setProductoId] = useState('')
    const [errorModal, setErrorModal] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [exito, setExito] = useState('')

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

    const abrirModal = async () => {
        setProductoId('')
        setErrorModal('')
        setModalAbierto(true)
        try {
            const res = await fetch(`${API}/api/productos`, { headers: headers() })
            if (res.ok) {
                setProductos(await res.json())
            } else {
                setErrorModal('No se pudo cargar el listado de productos.')
            }
        } catch {
            setErrorModal('No se pudo conectar con el servidor.')
        }
    }

    const cerrarModal = () => setModalAbierto(false)

    // Solo productos existentes y activos que el CD aún no tiene: no se puede elegir otro
    const yaEnCentro = new Set(items.map(i => i.producto?.idProducto))
    const disponibles = productos.filter(p => p.activo !== false && !yaEnCentro.has(p.idProducto))

    const agregar = async () => {
        if (!productoId) {
            setErrorModal('Selecciona un producto.')
            return
        }
        setErrorModal('')
        setEnviando(true)
        try {
            const res = await fetch(`${API}/api/inventario-cd/${centro.id}`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({
                    producto: { idProducto: Number(productoId) },
                    cantidad: 0,
                }),
            })

            if (!res.ok) {
                setErrorModal(`Error del servidor (${res.status}). Si la sesión venció, cierra sesión y vuelve a entrar.`)
                return
            }

            // El backend responde 200 con un texto, también cuando rechaza la operación
            const mensaje = await res.text()
            if (mensaje !== MENSAJE_OK) {
                setErrorModal(mensaje)
                return
            }

            cerrarModal()
            setExito('Producto agregado al inventario exitosamente.')
            setTimeout(() => setExito(''), 4000)
            cargarInventario()
        } catch {
            setErrorModal('No se pudo conectar con el servidor. Verifica que el backend esté encendido.')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <button onClick={onVolver} className="text-sm text-slate-600 hover:text-slate-900 mb-3">
                ← Volver a Centros de Distribución
            </button>

            {/* Encabezado */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-slate-900">Inventario - {centro.nombre}</h1>
                <button
                    onClick={abrirModal}
                    disabled={!activo}
                    title={activo ? '' : 'El centro de distribución está inactivo'}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#1e3a5f' }}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Producto
                </button>
            </div>

            {!activo && (
                <div className="p-3 mb-4 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
                    Este centro de distribución está inactivo: puedes consultar su inventario, pero no agregar productos.
                </div>
            )}

            {exito && (
                <div className="flex items-center gap-2.5 p-3 mb-4 rounded-lg border border-green-200 bg-green-50">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-green-800">{exito}</span>
                </div>
            )}

            {errorCarga && (
                <div className="p-3 mb-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                    {errorCarga}
                </div>
            )}

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
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

            {/* Modal Agregar producto */}
            {modalAbierto && (
                <Modal title="Agregar producto al inventario" onClose={cerrarModal} size="md">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Producto</label>
                    <select
                        value={productoId}
                        onChange={e => setProductoId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                        <option value="">Selecciona un producto</option>
                        {disponibles.map(p => (
                            <option key={p.idProducto} value={p.idProducto}>
                                {p.identificador} - {p.nombre}
                            </option>
                        ))}
                    </select>
                    {disponibles.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">No hay productos disponibles para agregar.</p>
                    )}
                    {errorModal && (
                        <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                            {errorModal}
                        </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={cerrarModal} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={agregar}
                            disabled={enviando}
                            className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: '#1e3a5f' }}
                        >
                            {enviando ? 'Agregando...' : 'Agregar'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}