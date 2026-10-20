import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import InventarioCD from './InventarioCD'

const FORM_INICIAL = {
    nombre: '',
    ubicacion: '',
    encargadoId: '',
}

const FORM_EDICION_INICIAL = {
    id: null,
    nombre: '',
    ubicacion: '',
    encargadoId: '',
    cambiarEstado: false,
}

const MENSAJE_EDITADO = 'El centro de distribución se ha actualizado correctamente'
const MENSAJE_ESTADO = 'El estado del centro ha sido actualizado con éxito'

// Solo "ACTIVO" cuenta como activo: un estado nulo o desconocido se trata como inactivo
const estaActivo = c => c?.estado === 'ACTIVO'

// Los PUT de centros exigen sesión de administrador (el token viaja en el header)
const headersAuth = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
})

// El backend responde 200 con un texto, también cuando rechaza la operación.
// Devuelve null si salió bien, o el mensaje de error para mostrarlo.
const enviarPut = async (url, body, mensajeOk) => {
    const res = await fetch(url, { method: 'PUT', headers: headersAuth(), body: JSON.stringify(body) })
    if (res.status === 401 || res.status === 403) {
        return 'No tienes permisos de administrador para realizar esta acción. Si la sesión venció, vuelve a iniciar sesión.'
    }
    if (!res.ok) return `Error del servidor (${res.status}).`
    const mensaje = await res.text()
    return mensaje === mensajeOk ? null : mensaje
}

export default function CentrosDistribucion({ puedeEditar }) {
    const [centros, setCentros] = useState([])
    const [encargados, setEncargados] = useState([])
    const [modalAbierto, setModalAbierto] = useState(false)
    const [busqueda, setBusqueda] = useState('')

    const [form, setForm] = useState(FORM_INICIAL)
    const [errores, setErrores] = useState({})
    const [exito, setExito] = useState('')
    const [errorServidor, setErrorServidor] = useState('')
    const [enviando, setEnviando] = useState(false)

    const [centroInventario, setCentroInventario] = useState(null)
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
    const [confirmacionEstadoAbierta, setConfirmacionEstadoAbierta] = useState(false)
    const [centroEditando, setCentroEditando] = useState(null)
    const [formEdicion, setFormEdicion] = useState(FORM_EDICION_INICIAL)

    useEffect(() => {
        cargarCentros()
        cargarEncargados()
    }, [])

    const cargarCentros = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/centros`)
            if (res.ok) {
                const data = await res.json()
                setCentros(data)
            }
        } catch (e) {
            console.error('Error al cargar centros:', e)
        }
    }

    const cargarEncargados = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/centros/encargados-disponibles`)
            if (res.ok) {
                const data = await res.json()
                setEncargados(data)
            }
        } catch (e) {
            console.error('Error al cargar encargados:', e)
        }
    }

    const abrirModal = () => {
        setForm(FORM_INICIAL)
        setErrores({})
        setErrorServidor('')
        setModalAbierto(true)
    }

    const cerrarModal = () => setModalAbierto(false)

    // ---------- HU3.6: editar centro ----------

    const abrirModalEditar = centro => {
        setCentroEditando(centro)
        setConfirmacionEstadoAbierta(false)
        setFormEdicion({
            id: centro.id,
            nombre: centro.nombre || '',
            ubicacion: centro.ubicacion || '',
            encargadoId: centro.encargado ? String(centro.encargado.id) : '',
            cambiarEstado: false,
        })
        setErrores({})
        setErrorServidor('')
        setModalEditarAbierto(true)
    }

    const cerrarModalEditar = () => {
        setConfirmacionEstadoAbierta(false)
        setModalEditarAbierto(false)
    }

    const activoActual = estaActivo(centroEditando)
    // Estado en el que quedará el centro si se confirma el formulario
    const quedaActivo = formEdicion.cambiarEstado ? !activoActual : activoActual

    // /encargados-disponibles excluye al encargado actual (ya está ocupado): se agrega a mano
    // para que no quede como "Sin asignar" al abrir el modal
    const opcionesEncargado = [
        ...(centroEditando?.encargado
            ? [{ id: centroEditando.encargado.id, nombre: centroEditando.encargado.name }]
            : []),
        ...encargados,
    ]

    const cambiarCheckboxEstado = e => {
        const nuevoEstado = e.target.checked
        const encargadoOriginal = centroEditando?.encargado ? String(centroEditando.encargado.id) : ''
        setFormEdicion(prev => ({
            ...prev,
            cambiarEstado: nuevoEstado !== activoActual,
            // un centro inactivo no puede tener encargado: al desactivar se quita, y al desmarcar se restaura
            encargadoId: activoActual ? (nuevoEstado ? encargadoOriginal : '') : prev.encargadoId,
        }))
    }

    const validarEdicion = () => {
        const errs = {}
        const nombre = formEdicion.nombre.trim()
        if (!nombre) errs.nombre = 'Campo obligatorio'
        else if (!/^[\p{L} ]+$/u.test(nombre)) errs.nombre = 'El nombre solo puede contener letras y espacios'
        if (!formEdicion.ubicacion.trim()) errs.ubicacion = 'Campo obligatorio'
        setErrores(errs)
        return Object.keys(errs).length === 0
    }

    const guardarEdicion = async () => {
        if (!validarEdicion()) return

        if (formEdicion.cambiarEstado) {
            setConfirmacionEstadoAbierta(true)
            return
        }

        await ejecutarEdicion()
    }

    const ejecutarEdicion = async () => {
        const activando = formEdicion.cambiarEstado && !activoActual
        const desactivando = formEdicion.cambiarEstado && activoActual

        setErrorServidor('')
        setEnviando(true)
        const urlBase = `${import.meta.env.VITE_API_URL}/api/centros/${formEdicion.id}`
        const datos = {
            nombre: formEdicion.nombre.trim(),
            ubicacion: formEdicion.ubicacion.trim(),
            encargado: quedaActivo && formEdicion.encargadoId ? { id: Number(formEdicion.encargadoId) } : null,
        }
        const estado = { estado: activando ? 'ACTIVO' : 'INACTIVO' }

        try {
            // Al activar, el estado va primero: el backend no deja asignar encargado a un centro inactivo
            if (activando) {
                const errorEstado = await enviarPut(`${urlBase}/estado`, estado, MENSAJE_ESTADO)
                if (errorEstado) {
                    setErrorServidor(errorEstado)
                    return
                }
            }

            const errorDatos = await enviarPut(urlBase, datos, MENSAJE_EDITADO)
            if (errorDatos) {
                if (activando) {
                    // El centro ya quedó activo: se refleja y el reintento solo envía los datos
                    setCentroEditando(c => ({ ...c, estado: 'ACTIVO' }))
                    setFormEdicion(prev => ({ ...prev, cambiarEstado: false }))
                    cargarCentros()
                    setErrorServidor(`El centro se activó, pero no se guardaron los demás cambios: ${errorDatos}`)
                } else {
                    setErrorServidor(errorDatos)
                }
                return
            }

            // Al desactivar, el estado va después de guardar los datos (el backend también quita el encargado)
            if (desactivando) {
                const errorEstado = await enviarPut(`${urlBase}/estado`, estado, MENSAJE_ESTADO)
                if (errorEstado) {
                    cargarCentros()
                    setErrorServidor(`Los datos se guardaron, pero no se pudo desactivar el centro: ${errorEstado}`)
                    return
                }
            }

            setExito('Centro de distribución actualizado exitosamente.')
            cerrarModalEditar()
            cargarCentros()
            cargarEncargados()
            setTimeout(() => setExito(''), 3000)
        } catch {
            setErrorServidor('No se pudo conectar con el servidor. Verifica que el backend esté encendido.')
        } finally {
            setEnviando(false)
        }
    }

    const validar = () => {
        const errs = {}
        if (!form.nombre.trim()) errs.nombre = 'Campo obligatorio'
        if (!form.ubicacion.trim()) errs.ubicacion = 'Campo obligatorio'
        setErrores(errs)
        return Object.keys(errs).length === 0
    }

    const guardar = async () => {
        if (!validar()) return
        setErrorServidor('')
        setEnviando(true)
        try {
            const body = {
                nombre: form.nombre.trim(),
                ubicacion: form.ubicacion.trim(),
            }
            if (form.encargadoId) {
                body.encargado = { id: Number(form.encargadoId) }
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/centros`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                setErrorServidor(`Error del servidor (${res.status}).`)
                return
            }

            const mensaje = await res.text()
            if (mensaje !== 'Centro de distribución registrado correctamente') {
                setErrorServidor(mensaje)
                return
            }

            setExito('Centro de distribución registrado correctamente.')
            cerrarModal()
            cargarCentros()
            cargarEncargados()
            setTimeout(() => setExito(''), 3000)
        } catch {
            setErrorServidor('No se pudo conectar con el servidor. Verifica que el backend esté encendido.')
        } finally {
            setEnviando(false)
        }
    }

    const f = campo => e => setForm(prev => ({ ...prev, [campo]: e.target.value }))
    const fe = campo => e => setFormEdicion(prev => ({ ...prev, [campo]: e.target.value }))

    const centrosFiltrados = centros.filter(c =>
        c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.ubicacion?.toLowerCase().includes(busqueda.toLowerCase())
    )

    if (centroInventario) {
        return (
            <InventarioCD
                centro={centroInventario}
                onVolver={() => {
                    setCentroInventario(null)
                    cargarCentros()
                }}
            />
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Centros de Distribución</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Gestión de centros de distribución (CD)</p>
                </div>
                <button
                    onClick={abrirModal}
                    className="data-table-primary-button"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Registrar CD
                </button>
            </div>

            {/* Notificación de éxito */}
            {exito && (
                <div className="flex items-center gap-2.5 p-3 mb-4 rounded-lg border border-green-200 bg-green-50">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-green-800">{exito}</span>
                </div>
            )}

            {/* Búsqueda */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-48">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ubicación..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="data-table-card">
                <div className="data-table-scroll">
                    <table className="data-table">
                        <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                            {['Nombre', 'Ubicación', 'Encargado', 'Fecha de registro', 'Estado', 'Acciones'].map(h => (
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
                        {centrosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                                    No hay centros de distribución registrados.
                                </td>
                            </tr>
                        ) : (
                            centrosFiltrados.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{c.nombre}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.ubicacion}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                        {c.encargado ? c.encargado.name : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                                        {c.fechaRegistro}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {estaActivo(c) ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                Inactivo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setCentroInventario(c)}
                                                aria-label={`Ver inventario de ${c.nombre}`}
                                                title="Ver inventario"
                                                className="data-table-action"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 12s3.5-7 9.75-7 9.75 7 9.75 7-3.5 7-9.75 7-9.75-7-9.75-7Z" />
                                                    <circle cx="12" cy="12" r="3" strokeWidth={2} />
                                                </svg>
                                            </button>
                                            {puedeEditar && (
                                                <button
                                                    type="button"
                                                    onClick={() => abrirModalEditar(c)}
                                                    aria-label={`Editar ${c.nombre}`}
                                                    title="Editar"
                                                    className="data-table-action"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16.862 4.487 2.651 2.651M7 17l4-1 9.513-9.513a1.875 1.875 0 0 0-2.652-2.652L8.348 13.348 7 17Z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
                    {centrosFiltrados.length} de {centros.length} centros de distribución
                </div>
            </div>

            {/* Modal Registrar CD */}
            {modalAbierto && (
                <Modal title="Registrar centro de distribución" onClose={cerrarModal} size="md">
                    <div className="space-y-4">
                        <Field label="Nombre del CD *" error={errores.nombre}>
                            <input type="text" value={form.nombre} onChange={f('nombre')} className={inputCls(!!errores.nombre)} placeholder="Ej. CD Bogotá Principal" />
                        </Field>
                        <Field label="Ubicación *" error={errores.ubicacion}>
                            <input type="text" value={form.ubicacion} onChange={f('ubicacion')} className={inputCls(!!errores.ubicacion)} placeholder="Dirección o zona" />
                        </Field>
                        <Field label="Encargado asignado">
                            <select value={form.encargadoId} onChange={f('encargadoId')} className={inputCls(false)}>
                                <option value="">Sin asignar</option>
                                {encargados.map(enc => (
                                    <option key={enc.id} value={enc.id}>{enc.nombre}</option>
                                ))}
                            </select>
                            {encargados.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">No hay encargados de CD disponibles.</p>
                            )}
                        </Field>
                    </div>
                    {errorServidor && (
                        <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                            {errorServidor}
                        </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={cerrarModal} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={guardar}
                            disabled={enviando}
                            className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: '#1e3a5f' }}
                        >
                            {enviando ? 'Registrando...' : 'Registrar CD'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Editar CD (HU3.6) */}
            {modalEditarAbierto && (
                <Modal
                    title={confirmacionEstadoAbierta ? 'Confirmar cambio de estado' : 'Editar centro de distribución'}
                    onClose={cerrarModalEditar}
                    size="md"
                >
                    {confirmacionEstadoAbierta ? (
                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                ¿Seguro que deseas {quedaActivo ? 'activar' : 'desactivar'} este centro de distribución?
                            </p>
                            <p className="mt-1 mb-6 text-sm text-slate-500">{formEdicion.nombre}</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setConfirmacionEstadoAbierta(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Volver
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConfirmacionEstadoAbierta(false)
                                        ejecutarEdicion()
                                    }}
                                    disabled={enviando}
                                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                                    style={{ backgroundColor: quedaActivo ? '#15803d' : '#dc2626' }}
                                >
                                    Sí, {quedaActivo ? 'activar' : 'desactivar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                    <>
                    <div className="space-y-4">
                        <Field label="Nombre del CD *" error={errores.nombre}>
                            <input type="text" value={formEdicion.nombre} onChange={fe('nombre')} className={inputCls(!!errores.nombre)} />
                        </Field>
                        <Field label="Ubicación *" error={errores.ubicacion}>
                            <input type="text" value={formEdicion.ubicacion} onChange={fe('ubicacion')} className={inputCls(!!errores.ubicacion)} />
                        </Field>
                        <Field label="Encargado asignado">
                            <select
                                value={formEdicion.encargadoId}
                                onChange={fe('encargadoId')}
                                disabled={!quedaActivo}
                                className={`${inputCls(false)} disabled:bg-slate-100 disabled:text-slate-400`}
                            >
                                <option value="">Sin asignar</option>
                                {opcionesEncargado.map(enc => (
                                    <option key={enc.id} value={enc.id}>{enc.nombre}</option>
                                ))}
                            </select>
                            {!quedaActivo && (
                                <p className="text-xs text-amber-600 mt-1">Un centro inactivo no puede tener encargado asignado.</p>
                            )}
                            {quedaActivo && opcionesEncargado.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">No hay encargados de CD disponibles.</p>
                            )}
                        </Field>
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={quedaActivo}
                                    onChange={cambiarCheckboxEstado}
                                    className="w-4 h-4 rounded border-slate-300"
                                />
                                Activar/desactivar
                            </label>
                        </div>
                    </div>
                    {errorServidor && (
                        <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                            {errorServidor}
                        </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={cerrarModalEditar} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={guardarEdicion}
                            disabled={enviando}
                            className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: '#1e3a5f' }}
                        >
                            {enviando ? 'Guardando...' : 'Confirmar'}
                        </button>
                    </div>
                    </>
                    )}
                </Modal>
            )}
        </div>
    )
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
            {children}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    )
}

function inputCls(hasError) {
    return `w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
        hasError ? 'border-red-400 bg-red-50' : 'border-slate-300'
    }`
}