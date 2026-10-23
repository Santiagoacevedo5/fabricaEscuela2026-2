import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

// Consulta del inventario de una tienda. Los productos ya no se agregan desde aquí:
// entran a la tienda solo por despacho desde su CD y salen solo por ventas.
export default function InventarioTienda({ tienda, onVolver }) {
  const [items, setItems] = useState([])
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

  useEffect(() => {
    cargarInventario()
  }, [tienda.id])

  return (
      <div className="mx-auto w-full max-w-7xl p-6 md:p-8">
        <button onClick={onVolver} className="text-sm text-slate-600 hover:text-slate-900 mb-3">
          ← Volver a Tiendas
        </button>

        <div className="mb-4">
          <h1 className="text-xl font-semibold text-slate-900">Inventario - {tienda.nombre}</h1>
        </div>

        {tienda.activa === false && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-amber-50 border border-amber-200 text-amber-800">
              Esta tienda está inactiva.
            </div>
        )}

        <div className="data-table-card">
          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del producto</th>
                <th>Unidades disponibles</th>
              </tr>
              </thead>
              <tbody>
              {items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.producto?.identificador ?? i.producto?.idProducto}</td>
                    <td>{i.producto?.nombre}</td>
                    <td>
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
                    <td colSpan={3}>
                      Esta tienda aún no tiene productos en su inventario.
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  )
}