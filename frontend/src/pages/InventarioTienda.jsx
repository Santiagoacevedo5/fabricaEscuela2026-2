import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

export default function InventarioTienda({ tienda, onVolver }) {
  const [items, setItems] = useState([])
  const [disponibles, setDisponibles] = useState([])
  const [modal, setModal] = useState(false)
  const [productoId, setProductoId] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [cargando, setCargando] = useState(true)

  const cargarInventario = async () => {
    try {
      const r = await fetch(`${API}/api/inventario`, { headers: headers() })
      if (r.ok) {
        const todos = await r.json()
        setItems(todos.filter((i) => i.tienda?.id === tienda.id))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  // Productos activos del catálogo que la tienda aún no tiene
  const cargarDisponibles = async () => {
    try {
      const r = await fetch(`${API}/api/productos`, { headers: headers() })
      if (r.ok) {
        const productos = await r.json()
        const yaEnTienda = new Set(items.map((i) => i.producto?.idProducto))
        setDisponibles(productos.filter((p) => p.activo !== false && !yaEnTienda.has(p.idProducto)))
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    cargarInventario()
  }, [tienda.id])

  const abrirModal = () => {
    setProductoId('')
    setError('')
    cargarDisponibles()
    setModal(true)
  }

  const agregar = async () => {
    if (!productoId) {
      setError('Selecciona un producto.')
      return
    }
    try {
      const r = await fetch(`${API}/api/inventario`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          tienda: { id: tienda.id },
          producto: { idProducto: Number(productoId) },
          cantidad: 0,
        }),
      })
      if (r.status === 201) {
        setModal(false)
        setExito('Producto agregado al inventario exitosamente.')
        setTimeout(() => setExito(''), 4000)
        cargarInventario()
      } else {
        setError((await r.text()) || 'No se pudo agregar el producto.')
      }
    } catch (e) {
      setError('No se pudo conectar con el servidor.')
    }
  }

  return (
    <div className="p-6">
      <button onClick={onVolver} className="text-sm text-slate-600 hover:text-slate-900 mb-3">
        ← Volver a Tiendas
      </button>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Inventario - {tienda.nombre}</h1>
        <button
          onClick={abrirModal}
          disabled={tienda.activa === false}
          title={tienda.activa === false ? 'La tienda está inactiva' : ''}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Agregar Producto
        </button>
      </div>

      {exito && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-green-50 border border-green-200 text-green-800">
          {exito}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Nombre del producto</th>
              <th className="px-5 py-3 font-medium">Unidades disponibles</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-5 py-3">{i.producto?.identificador ?? i.producto?.idProducto}</td>
                <td className="px-5 py-3">{i.producto?.nombre}</td>
                <td className="px-5 py-3">
                  {i.cantidad === 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Sin existencias
                    </span>
                  ) : (
                    i.cantidad
                  )}
                </td>
              </tr>
            ))}
            {!cargando && items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-slate-400">
                  Esta tienda aún no tiene productos en su inventario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Agregar producto al inventario</h2>
            <label className="block text-sm text-slate-600 mb-1">Producto</label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Selecciona un producto</option>
              {disponibles.map((p) => (
                <option key={p.idProducto} value={p.idProducto}>
                  {p.identificador} - {p.nombre}
                </option>
              ))}
            </select>
            {disponibles.length === 0 && (
              <p className="text-xs text-slate-400 mt-2">No hay productos disponibles para agregar.</p>
            )}
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-300">
                Cancelar
              </button>
              <button onClick={agregar} className="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
