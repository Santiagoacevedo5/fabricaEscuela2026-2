import { useEffect, useState } from 'react'

// NUEVO: HU7.1
import Modal from '../components/Modal'
import { crearOrden } from '../ordenesApi'

const API = import.meta.env.VITE_API_URL
const URL = `${API}/api/recomendaciones-reposicion`
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

export default function RecomendacionesReposicion() {
  const [recomendaciones, setRecomendaciones] = useState([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  // NUEVO: HU7.1 - Estados para crear una orden
  const [seleccion, setSeleccion] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState('')
  const [errorModal, setErrorModal] = useState('')

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

  // NUEVO: HU7.1 - Crear orden desde una recomendación
  const confirmar = async () => {
    if (!seleccion || guardando) return

    setGuardando(true)
    setErrorModal('')
    setExito('')
    setError('')

    try {
      const orden = await crearOrden({
        tiendaId: seleccion.tiendaId,
        items: [
          {
            productoId: seleccion.productoId,
            cantidad: seleccion.cantidadSugerida
          }
        ]
      })

      setExito(`Orden #${orden.id} creada en estado Pendiente.`)
      setSeleccion(null)

      // Actualizar las recomendaciones desde el backend
      try {
        const respuesta = await fetch(URL, { headers: headers() })
        if (!respuesta.ok) throw new Error('No se pudieron actualizar las recomendaciones.')
        setRecomendaciones(await respuesta.json())
      } catch (e) {
        setError(e.message)
      }

    } catch (e) {
      setErrorModal(e.message)
    } finally {
      setGuardando(false)
    }
  }

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

          {/* NUEVO: HU7.1 - Mensaje de éxito */}
          {exito && <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✓ {exito}</div>}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className={th}>Producto</th>
                <th className={th}>Tienda</th>
                <th className={th}>Stock actual</th>
                <th className={th}>Cantidad sugerida a enviar</th>

                {/* NUEVO: HU7.1 - Columna de acciones */}
                <th className={th}>Acciones</th>
              </tr>
              </thead>
              <tbody>

              {/* MODIFICADO: HU7.1 - colSpan pasa de 4 a 5 */}
              {cargando ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">Cargando recomendaciones...</td></tr>
              ) : error ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-red-600">No se pudo verificar si hay reposiciones pendientes.</td></tr>
              ) : recomendaciones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-sm text-slate-600">
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

                    {/* NUEVO: HU7.1 - Botón Crear orden */}
                    <td className={td}>
                      <button
                          disabled={guardando || r.cantidadSugerida <= 0}
                          onClick={() => {
                            setSeleccion(r)
                            setErrorModal('')
                            setExito('')
                          }}
                          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        Crear orden
                      </button>
                    </td>

                  </tr>
              ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              {cargando || error ? ' ' : `${recomendaciones.length} ${recomendaciones.length === 1 ? 'recomendación pendiente' : 'recomendaciones pendientes'}`}
            </p>
          </div>

          {/* NUEVO: HU7.1 - Modal de confirmación */}
          {seleccion && (
              <Modal
                  title="Confirmar orden de reabastecimiento"
                  size="lg"
                  onClose={() => {
                    if (!guardando) setSeleccion(null)
                  }}>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-400">Tienda de destino</p>
                  <p className="font-semibold">{seleccion.tienda}</p>
                  <p className="text-sm text-slate-500">{seleccion.region}</p>
                </div>

                <h3 className="mt-5 mb-2 text-sm font-semibold">Productos y cantidades</h3>

                <table className="w-full border border-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-3 text-left">Producto</th>
                    <th className="p-3 text-right">Cantidad</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td className="p-4">
                      {seleccion.producto}
                      <p className="text-xs text-slate-400">{seleccion.identificador}</p>
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {seleccion.cantidadSugerida} unidades
                    </td>
                  </tr>
                  </tbody>
                </table>

                {errorModal && (
                    <p role="alert" className="mt-3 text-sm text-red-600">{errorModal}</p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                      disabled={guardando}
                      className="rounded-lg bg-slate-100 px-4 py-2 text-sm"
                      onClick={() => setSeleccion(null)}>
                    Cancelar
                  </button>

                  <button
                      disabled={guardando || seleccion.cantidadSugerida <= 0}
                      className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      onClick={confirmar}>
                    {guardando ? 'Creando...' : 'Confirmar orden'}
                  </button>
                </div>

              </Modal>
          )}

        </div>
      </div>
  )
}