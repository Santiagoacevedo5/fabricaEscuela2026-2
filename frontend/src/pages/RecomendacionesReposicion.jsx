import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL
const URL = `${API}/api/recomendaciones-reposicion`
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

export default function RecomendacionesReposicion() {
  const [recomendaciones, setRecomendaciones] = useState([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    fetch(URL, { headers: headers() })
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error((await respuesta.text()) || 'No se pudieron cargar las recomendaciones.')
        return respuesta.json()
      })
      .then((datos) => {
        if (vigente) setRecomendaciones(datos)
      })
      .catch((e) => {
        if (vigente) setError(e.message || 'No se pudieron cargar las recomendaciones.')
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => { vigente = false }
  }, [])

  const th = 'px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'
  const td = 'px-5 py-4 text-sm text-slate-700'

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Recomendaciones de reposición</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tiendas bajo el umbral de inventario asignadas a tu centro de distribución
          </p>
        </div>

        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className={th}>Producto</th>
                <th className={th}>Tienda</th>
                <th className={th}>Stock actual</th>
                <th className={th}>Cantidad sugerida a enviar</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-400">Cargando recomendaciones...</td></tr>
              ) : error ? (
                <tr><td colSpan={4} className="py-12 text-center text-sm text-red-600">No se pudo verificar si hay reposiciones pendientes.</td></tr>
              ) : recomendaciones.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 text-center text-sm text-slate-600">
                    <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600" aria-hidden="true">✓</span>
                    No hay reposiciones pendientes
                  </td>
                </tr>
              ) : recomendaciones.map((r) => (
                <tr key={r.reglaId} className="border-b border-slate-100 last:border-0">
                  <td className={td}>
                    <p className="font-medium text-slate-900">{r.producto}</p>
                    <p className="text-xs text-slate-400">{r.identificador}</p>
                  </td>
                  <td className={td}>
                    <p>{r.tienda}</p>
                    <p className="text-xs text-slate-400">{r.region}</p>
                  </td>
                  <td className={td}>
                    <span className={r.stockActual < r.umbralMinimo ? 'font-medium text-orange-700' : ''}>{r.stockActual}</span>
                    <span className="ml-1 text-slate-400">unidades</span>
                  </td>
                  <td className={td}>
                    <span className="font-semibold text-slate-900">{r.cantidadSugerida} unidades</span>
                    {r.parcial && <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Parcial</span>}
                    {r.parcial && <p className="mt-1 text-xs text-slate-400">Limitado al stock disponible del CD</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            {cargando || error ? ' ' : `${recomendaciones.length} ${recomendaciones.length === 1 ? 'recomendación pendiente' : 'recomendaciones pendientes'}`}
          </p>
        </div>
      </div>
    </div>
  )
}
