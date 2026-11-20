import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import {
    listarOrdenes,
    obtenerOrden,
    aprobarOrden,
    rechazarOrden,
    enviarOrden
} from '../ordenesApi'

const boton = 'rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

const rojo = 'rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

const cancelar = 'rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700'

const colores = {
    Pendiente: 'bg-amber-100 text-amber-800',
    Aprobada: 'bg-blue-100 text-blue-800',
    Rechazada: 'bg-red-100 text-red-700',
    Enviada: 'bg-violet-100 text-violet-700',
    Recibida: 'bg-green-100 text-green-800'
}

function Estado({ estado }) {
    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            colores[estado] || 'bg-slate-100 text-slate-700'
        }`}>
            {estado}
        </span>
    )
}

const fecha = f => f
    ? new Date(f).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
    : '—'

const hora = f => f
    ? new Date(f).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    })
    : ''

export default function Ordenes() {

    const [ordenes, setOrdenes] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')

    const [detalle, setDetalle] = useState(null)
    const [modal, setModal] = useState('')
    const [motivo, setMotivo] = useState('')
    const [errorModal, setErrorModal] = useState('')
    const [ocupado, setOcupado] = useState(false)

    // Cargar órdenes existentes
    useEffect(() => {

        let vigente = true

        listarOrdenes()
            .then(d => {
                if (vigente) setOrdenes(d)
            })
            .catch(e => {
                if (vigente) setError(e.message)
            })
            .finally(() => {
                if (vigente) setCargando(false)
            })

        return () => { vigente = false }

    }, [])

    // Consultar detalle de una orden
    const ver = async id => {

        setError('')
        setErrorModal('')
        setOcupado(true)

        try {
            setDetalle(await obtenerOrden(id))
            setModal('detalle')
        } catch (e) {
            setError(e.message)
        } finally {
            setOcupado(false)
        }
    }

    const cerrar = () => {
        if (!ocupado) {
            setModal('')
            setErrorModal('')
        }
    }

    // Aprobar, rechazar o enviar - Task 135
    const confirmar = async () => {

        if (ocupado || !detalle) return

        if (modal === 'rechazar' && !motivo.trim()) {
            return setErrorModal(
                'El motivo de rechazo es obligatorio.'
            )
        }

        if (modal === 'rechazar' && motivo.length > 500) {
            return setErrorModal(
                'El motivo no puede superar los 500 caracteres.'
            )
        }

        setOcupado(true)
        setErrorModal('')
        setError('')
        setExito('')

        const accion = modal

        try {

            const actualizado = accion === 'enviar'
                ? await enviarOrden(detalle.id)
                : accion === 'aprobar'
                    ? await aprobarOrden(detalle.id)
                    : await rechazarOrden(detalle.id, motivo.trim())

            setExito(
                `Orden #${detalle.id} ${
                    accion === 'enviar'
                        ? 'enviada'
                        : accion === 'aprobar'
                            ? 'aprobada'
                            : 'rechazada'
                }.`
            )

            const nuevo = {
                ...detalle,
                estado: actualizado.estado,
                fechaRevision: actualizado.fechaRevision,
                revisadoPor: actualizado.revisadoPor,
                motivoRechazo: actualizado.motivoRechazo,
                fechaEnvio: actualizado.fechaEnvio,
                enviadoPor: actualizado.enviadoPor
            }

            setDetalle(nuevo)

            setOrdenes(p =>
                p.map(o => o.id === nuevo.id ? nuevo : o)
            )

            setModal('detalle')

            try {
                const d = await obtenerOrden(detalle.id)
                setDetalle(d)
                setOrdenes(await listarOrdenes())
            } catch {
                setError(
                    'Orden procesada. No se pudo actualizar la consulta completa.'
                )
            }

        } catch (e) {

            setErrorModal(e.message)

            // Actualizar el estado si otro usuario procesó la orden
            try {
                const d = await obtenerOrden(detalle.id)
                setDetalle(d)
                setOrdenes(p =>
                    p.map(o => o.id === d.id ? d : o)
                )
            } catch {
                // Mantener mensaje de error original
            }

        } finally {
            setOcupado(false)
        }
    }

    const abrirAccion = tipo => {
        setMotivo('')
        setErrorModal('')
        setModal(tipo)
    }

    const pendientes = detalle?.estado === 'Pendiente'

    // Task 135: Solo las órdenes aprobadas pueden enviarse
    const puedeEnviar = detalle?.estado === 'Aprobada'

    return (

        <div className="p-6 md:p-8">
            <div className="mx-auto max-w-7xl">

                <h1 className="text-2xl font-bold text-slate-900">
                    Órdenes de reabastecimiento
                </h1>

                <p className="mt-1 mb-6 text-sm text-slate-500">
                    Consulta, aprueba, rechaza o envía las órdenes del centro de distribución
                </p>

                {error && (
                    <p role="alert"
                       className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

                        {error}

                    </p>
                )}

                {exito && (
                    <p role="status"
                       className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">

                        ✓ {exito}

                    </p>
                )}

                {/* Tabla de órdenes */}

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">

                    <table className="w-full min-w-[800px] text-left text-sm">

                        <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            {[
                                'Orden',
                                'Tienda / CD',
                                'Productos',
                                'Creada',
                                'Estado',
                                'Detalle'
                            ].map(h => (
                                <th key={h}
                                    className="px-4 py-3 text-xs uppercase tracking-wide text-slate-500">
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>

                        <tbody>

                        {cargando ? (

                            <tr>
                                <td colSpan="6"
                                    className="p-10 text-center text-slate-500">
                                    Cargando órdenes...
                                </td>
                            </tr>

                        ) : ordenes.length === 0 ? (

                            <tr>
                                <td colSpan="6"
                                    className="p-10 text-center text-slate-500">

                                    {error
                                        ? 'No se pudieron cargar las órdenes.'
                                        : 'No hay órdenes registradas.'}

                                </td>
                            </tr>

                        ) : [...ordenes]
                            .sort((a, b) => b.id - a.id)
                            .map(o => (

                                <tr key={o.id}
                                    className="border-b border-slate-100">

                                    <td className="p-4 font-medium">
                                        #{o.id}
                                    </td>

                                    <td className="p-4">
                                        {o.tiendaNombre}

                                        <p className="text-xs text-slate-400">
                                            {o.centroNombre}
                                        </p>
                                    </td>

                                    <td className="p-4">

                                        {o.items?.length || 0} producto(s)

                                        <p className="text-xs text-slate-400">

                                            {(o.items || []).reduce(
                                                (a, i) => a + i.cantidad, 0
                                            )} unidades en total

                                        </p>

                                    </td>

                                    <td className="p-4">

                                        {fecha(o.fechaCreacion)}

                                        <p className="text-xs text-slate-400">
                                            {hora(o.fechaCreacion)}
                                        </p>

                                    </td>

                                    <td className="p-4">
                                        <Estado estado={o.estado}/>
                                    </td>

                                    <td className="p-4">

                                        {/* Botón compacto de detalle */}
                                        <button
                                            type="button"
                                            disabled={ocupado}
                                            onClick={() => ver(o.id)}
                                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">

                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true">

                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.8}
                                                    d="M2.25 12s3.75-7 9.75-7 9.75 7 9.75 7-3.75 7-9.75 7S2.25 12 2.25 12z"
                                                />

                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="3"
                                                    strokeWidth={1.8}
                                                />

                                            </svg>

                                            Ver detalle

                                        </button>

                                    </td>

                                </tr>
                            ))}

                        </tbody>

                    </table>

                    <p className="border-t border-slate-100 p-4 text-xs text-slate-400">
                        {ordenes.length} órdenes registradas
                    </p>

                </div>

                {/* Modal de detalle */}

                {modal === 'detalle' && detalle && (

                    <Modal
                        title={`Detalle de orden #${detalle.id}`}
                        size="lg"
                        onClose={cerrar}>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex justify-between gap-3">

                            <div>

                                <p className="text-xs font-semibold text-slate-400 uppercase">
                                    Tienda de destino
                                </p>

                                <h3 className="font-semibold">
                                    {detalle.tiendaNombre}
                                </h3>

                                <p className="text-sm text-slate-500">
                                    {detalle.centroNombre}
                                </p>

                                <p className="text-xs text-slate-600 mt-2">

                                    Encargado tienda:
                                    {' '}
                                    {detalle.encargadoTiendaNombre || 'Sin asignar'}

                                    <br/>

                                    Encargado CD:
                                    {' '}
                                    {detalle.encargadoCentroNombre || 'Sin asignar'}

                                </p>

                            </div>

                            <div>
                                <Estado estado={detalle.estado}/>
                            </div>

                        </div>

                        {/* Productos y cantidades */}

                        <table className="my-5 w-full text-sm border border-slate-200">

                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="p-3 text-left">Producto</th>
                                <th className="p-3 text-right">Cantidad</th>
                            </tr>
                            </thead>

                            <tbody>

                            {(detalle.items || []).map(i => (

                                <tr key={i.productoId}
                                    className="border-t border-slate-100">

                                    <td className="p-4">

                                        {i.productoNombre}

                                        <p className="text-xs text-slate-400">
                                            ID: {i.productoId}
                                        </p>

                                    </td>

                                    <td className="p-4 text-right font-semibold">
                                        {i.cantidad} unidades
                                    </td>

                                </tr>
                            ))}

                            {!detalle.items?.length && (

                                <tr>
                                    <td colSpan="2" className="p-4 text-slate-500">
                                        Sin productos registrados.
                                    </td>
                                </tr>

                            )}

                            </tbody>

                        </table>

                        {/* Datos de revisión */}

                        {detalle.fechaRevision && (

                            <div className={`rounded-lg border p-4 text-sm ${
                                detalle.estado === 'Rechazada'
                                    ? 'bg-red-50 border-red-200 text-red-800'
                                    : 'bg-green-50 border-green-200 text-green-800'
                            }`}>

                                <p>
                                    <b>Revisada por:</b> {detalle.revisadoPor}
                                </p>

                                <p>
                                    <b>Fecha y hora:</b>
                                    {' '}
                                    {fecha(detalle.fechaRevision)} · {hora(detalle.fechaRevision)}
                                </p>

                                {detalle.motivoRechazo && (

                                    <p className="mt-2 break-words">

                                        <b>Motivo del rechazo:</b>
                                        {' '}
                                        {detalle.motivoRechazo}

                                    </p>

                                )}

                            </div>

                        )}

                        {/* Task 135 - Datos de auditoría del envío */}

                        {detalle.fechaEnvio && (

                            <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">

                                <p>
                                    <b>Enviada por:</b> {detalle.enviadoPor}
                                </p>

                                <p>
                                    <b>Fecha y hora:</b>
                                    {' '}
                                    {fecha(detalle.fechaEnvio)} · {hora(detalle.fechaEnvio)}
                                </p>

                            </div>

                        )}

                        <div className="mt-6 flex flex-wrap justify-end gap-3">

                            <button
                                className={rojo}
                                disabled={!pendientes || ocupado}
                                onClick={() => abrirAccion('rechazar')}>

                                Rechazar

                            </button>

                            <button
                                className={boton}
                                disabled={!pendientes || ocupado}
                                onClick={() => abrirAccion('aprobar')}>

                                Aprobar

                            </button>

                            {/* Task 135 - Botón para enviar órdenes aprobadas */}

                            {puedeEnviar && (

                                <button
                                    className={boton + ' hover:brightness-110 transition-colors'}
                                    disabled={ocupado}
                                    onClick={() => abrirAccion('enviar')}>

                                    Marcar como enviada

                                </button>

                            )}

                        </div>

                    </Modal>

                )}

                {/* Modal de aprobación o rechazo */}

                {(modal === 'aprobar' || modal === 'rechazar') && detalle && (

                    <Modal
                        title={modal === 'aprobar'
                            ? 'Aprobar orden'
                            : 'Rechazar orden'}
                        onClose={cerrar}>

                        {modal === 'aprobar' ? (

                            <p className="text-sm text-slate-600">

                                ¿Confirmas la aprobación de la orden #{detalle.id}
                                {' '}para {detalle.tiendaNombre}?

                            </p>

                        ) : (

                            <label className="block text-sm text-slate-700">

                                Motivo del rechazo

                                <textarea
                                    className={`mt-2 w-full rounded-lg border p-3 ${
                                        errorModal ? 'border-red-400' : 'border-slate-300'
                                    }`}
                                    rows="4"
                                    maxLength={500}
                                    value={motivo}
                                    onChange={e => {
                                        setMotivo(e.target.value)
                                        setErrorModal('')
                                    }}
                                    placeholder="Explica por qué se rechaza esta orden..."
                                />

                            </label>

                        )}

                        {errorModal && (

                            <p role="alert"
                               className="mt-2 text-sm text-red-600">

                                {errorModal}

                            </p>

                        )}

                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                disabled={ocupado}
                                className={cancelar}
                                onClick={() => {
                                    setModal('detalle')
                                    setErrorModal('')
                                }}>

                                Cancelar

                            </button>

                            <button
                                disabled={ocupado || !pendientes}
                                className={modal === 'aprobar' ? boton : rojo}
                                onClick={confirmar}>

                                {ocupado
                                    ? 'Procesando...'
                                    : modal === 'aprobar'
                                        ? 'Confirmar aprobación'
                                        : 'Confirmar rechazo'}

                            </button>

                        </div>

                    </Modal>

                )}

                {/* Task 135 - Modal de confirmación de envío */}

                {modal === 'enviar' && detalle && (

                    <Modal
                        title="Confirmar envío de orden"
                        onClose={cerrar}>

                        <p className="text-sm text-slate-600">

                            ¿Confirmas el envío de la orden #{detalle.id}
                            {' '}para {detalle.tiendaNombre}?

                        </p>

                        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">

                            Los productos serán descontados del inventario
                            del centro de distribución. La tienda deberá
                            confirmar su recepción.

                        </p>

                        {errorModal && (

                            <p role="alert"
                               className="mt-2 text-sm text-red-600">

                                {errorModal}

                            </p>

                        )}

                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                className={cancelar}
                                disabled={ocupado}
                                onClick={() => {
                                    setModal('detalle')
                                    setErrorModal('')
                                }}>

                                Cancelar

                            </button>

                            <button
                                className={boton}
                                disabled={ocupado || !puedeEnviar}
                                onClick={confirmar}>

                                {ocupado
                                    ? 'Procesando...'
                                    : 'Confirmar envío'}

                            </button>

                        </div>

                    </Modal>

                )}

            </div>
        </div>
    )
}