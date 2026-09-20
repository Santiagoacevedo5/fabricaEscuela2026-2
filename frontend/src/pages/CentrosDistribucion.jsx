import { useState, useEffect } from 'react'
import Modal from '../components/Modal'

const FORM_INICIAL = {
    nombre: '',
    ubicacion: '',
    encargadoId: '',
}

export default function CentrosDistribucion() {
    const [centros, setCentros] = useState([])
    const [encargados, setEncargados] = useState([])
    const [modalAbierto, setModalAbierto] = useState(false)
    const [busqueda, setBusqueda] = useState('')

    const [form, setForm] = useState(FORM_INICIAL)
    const [errores, setErrores] = useState({})
    const [exito, setExito] = useState('')
    const [errorServidor, setErrorServidor] = useState('')
    const [enviando, setEnviando] = useState(false)

    useEffect(() => {
        cargarCentros()
        cargarEncargados()
    }, [])

    const cargarCentros = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/centros')
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
            const res = await fetch('http://localhost:8080/api/centros/encargados-disponibles')
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

            const res = await fetch('http://localhost:8080/api/centros', {
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

    const centrosFiltrados = centros.filter(c =>
        c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.ubicacion?.toLowerCase().includes(busqueda.toLowerCase())
    )

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
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#1e3a5f' }}
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                            {['Nombre', 'Ubicación', 'Encargado', 'Fecha de registro'].map(h => (
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
                                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
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
                                    <option key={enc.id} value={enc.id}>{enc.name}</option>
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