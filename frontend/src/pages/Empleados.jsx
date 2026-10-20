import { useState } from 'react'
import { ROL_LABELS, ROL_FULL_LABELS } from '../roles'
import Modal from '../components/Modal'

const ROLES_SPRINT1 = ['ROLE_ADMIN', 'ENCARGADO_TIENDA', 'ENCARGADO_CD']

const StatusBadge = ({ estado }) => (
    <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
            backgroundColor: estado === 'activo' ? '#dcfce7' : '#fee2e2',
            color: estado === 'activo' ? '#16a34a' : '#dc2626',
        }}
    >
    <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: estado === 'activo' ? '#16a34a' : '#dc2626' }}
    />
        {estado === 'activo' ? 'Activo' : 'Inactivo'}
  </span>
)

const FORM_INICIAL = {
    nombre: '',
    correo: '',
    documento: '',
    contacto: '',
    usuario: '',
    rol: 'ENCARGADO_TIENDA',
    contrasena: '',
    confirmarContrasena: '',
}

export default function Empleados({ empleados, onChange, puedeEditar = false }) {
    const [modalAbierto, setModalAbierto] = useState(false)
    const [empleadoEditando, setEmpleadoEditando] = useState(null)
    const [empleadoEliminando, setEmpleadoEliminando] = useState(null)
    const [form, setForm] = useState(FORM_INICIAL)
    const [formEdicion, setFormEdicion] = useState({ correo: '', contacto: '', rol: '' })
    const [errores, setErrores] = useState({})
    const [exito, setExito] = useState('')
    const [aviso, setAviso] = useState('')
    const [errorServidor, setErrorServidor] = useState('')
    const [enviando, setEnviando] = useState(false)

    const avisarEnDesarrollo = () => {
        setAviso('Esta función aún está en desarrollo.')
        setTimeout(() => setAviso(''), 3000)
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
        if (!form.correo.trim()) errs.correo = 'Campo obligatorio'
        if (!form.documento.trim()) errs.documento = 'Campo obligatorio'
        if (!form.contacto) errs.contacto = 'Campo obligatorio'
        else if (!/^\d{10}$/.test(form.contacto)) errs.contacto = 'Debe tener 10 dígitos'
        if (!form.usuario.trim()) errs.usuario = 'Campo obligatorio'
        if (!form.contrasena) errs.contrasena = 'Campo obligatorio'
        if (form.contrasena !== form.confirmarContrasena) errs.confirmarContrasena = 'Las contraseñas no coinciden'
        if (empleados.some(emp => emp.usuario === form.usuario)) errs.usuario = 'Usuario ya existe'
        if (empleados.some(emp => emp.correo === form.correo)) errs.correo = 'Correo ya existe'
        if (empleados.some(emp => emp.documento === form.documento)) errs.documento = 'Documento ya existe'
        setErrores(errs)
        return Object.keys(errs).length === 0
    }

    const guardar = async () => {
        if (!validar()) return
        setErrorServidor('')
        setEnviando(true)
        try {
            const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/auth/addNewUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.nombre.trim(),
                    email: form.correo.trim(),
                    documento: form.documento.trim(),
                    contacto: form.contacto,
                    username: form.usuario.trim(),
                    password: form.contrasena,
                    confirmarPassword: form.confirmarContrasena,
                    roles: form.rol,
                }),
            })

            if (!respuesta.ok) {
                setErrorServidor(`Error del servidor (${respuesta.status}).`)
                return
            }

            const mensaje = await respuesta.text()
            if (mensaje !== 'Empleado registrado correctamente') {
                // El backend explica el motivo (usuario duplicado, etc.)
                setErrorServidor(mensaje)
                return
            }

            const nuevo = {
                id: `emp-${Date.now()}`,
                nombre: form.nombre.trim(),
                correo: form.correo.trim(),
                documento: form.documento.trim(),
                contacto: form.contacto,
                usuario: form.usuario.trim(),
                rol: form.rol,
                estado: 'activo',
                fechaRegistro: new Date().toISOString().split('T')[0],
            }
            onChange([...empleados, nuevo])
            setExito('Empleado registrado correctamente.')
            cerrarModal()
            setTimeout(() => setExito(''), 3000)
        } catch {
            setErrorServidor('No se pudo conectar con el servidor. Verifica que el backend esté encendido.')
        } finally {
            setEnviando(false)
        }
    }

    const abrirEdicion = empleado => {
        setEmpleadoEditando(empleado)
        setFormEdicion({ correo: empleado.correo, contacto: empleado.contacto || '', rol: empleado.rol })
        setErrores({})
        setErrorServidor('')
    }

    const guardarEdicion = async () => {
        const errs = {}
        if (!formEdicion.correo.trim()) errs.correoEdicion = 'Campo obligatorio'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEdicion.correo.trim())) errs.correoEdicion = 'Correo no válido'
        else if (empleados.some(emp => emp.usuario !== empleadoEditando.usuario && emp.correo === formEdicion.correo.trim())) {
            errs.correoEdicion = 'Correo ya existe'
        }
        if (!/^\d{10}$/.test(formEdicion.contacto)) errs.contactoEdicion = 'Debe tener 10 dígitos'
        setErrores(errs)
        if (Object.keys(errs).length) return

        setErrorServidor('')
        setEnviando(true)
        try {
            const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/auth/users/${encodeURIComponent(empleadoEditando.usuario)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    email: formEdicion.correo.trim(),
                    contacto: formEdicion.contacto,
                    roles: formEdicion.rol,
                }),
            })
            if (!respuesta.ok) {
                setErrorServidor(`Error del servidor (${respuesta.status}).`)
                return
            }

            onChange(empleados.map(emp => emp.usuario === empleadoEditando.usuario
                ? { ...emp, correo: formEdicion.correo.trim(), contacto: formEdicion.contacto, rol: formEdicion.rol }
                : emp))
            setEmpleadoEditando(null)
            setExito('Empleado actualizado correctamente.')
            setTimeout(() => setExito(''), 3000)
        } catch {
            setErrorServidor('No se pudo conectar con el servidor. Verifica que el backend esté encendido.')
        } finally {
            setEnviando(false)
        }
    }

    const eliminarEmpleado = async () => {
        setErrorServidor('')
        setEnviando(true)
        try {
            const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/auth/users/${encodeURIComponent(empleadoEliminando.usuario)}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            })
            if (!respuesta.ok) {
                setErrorServidor((await respuesta.text()) || `Error del servidor (${respuesta.status}).`)
                return
            }

            onChange(empleados.filter(emp => emp.usuario !== empleadoEliminando.usuario))
            setEmpleadoEliminando(null)
            setExito('Empleado eliminado correctamente.')
            setTimeout(() => setExito(''), 3000)
        } catch {
            setErrorServidor('No se pudo conectar con el servidor. Verifica que el backend esté encendido.')
        } finally {
            setEnviando(false)
        }
    }

    const f = campo => e => setForm(prev => ({ ...prev, [campo]: e.target.value }))
    const fEdicion = campo => e => setFormEdicion(prev => ({ ...prev, [campo]: e.target.value }))

    return (
        <div className="p-6 mx-auto w-full max-w-7xl">
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Empleados</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Gestión de usuarios del sistema</p>
                </div>
                <button
                    onClick={abrirModal}
                    className="data-table-primary-button"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Registrar empleado
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

            {/* Aviso: función en desarrollo */}
            {aviso && (
                <div className="p-3 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    {aviso}
                </div>
            )}

            {/* Búsqueda y filtros (aún no funcionan) */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-48">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        readOnly
                        placeholder="Buscar por nombre, usuario o correo..."
                        onFocus={avisarEnDesarrollo}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value="todos"
                    onChange={avisarEnDesarrollo}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="todos">Todos los roles</option>
                    {ROLES_SPRINT1.map(r => (
                        <option key={r} value={r}>{ROL_FULL_LABELS[r]}</option>
                    ))}
                </select>
                <select
                    value="todos"
                    onChange={avisarEnDesarrollo}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                </select>
            </div>

            {/* Tabla */}
            <div className="data-table-card">
                <div className="data-table-scroll">
                    <table className="data-table">
                        <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                            {[
                                'Nombre', 'Usuario', 'Correo', 'Documento', 'Contacto', 'Rol', 'Estado', 'Fecha de registro',
                                ...(puedeEditar ? ['Acciones'] : []),
                            ].map(h => (
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
                        {empleados.length === 0 ? (
                            <tr>
                                <td colSpan={puedeEditar ? 9 : 8} className="px-4 py-10 text-center text-sm text-slate-400">
                                    No se encontraron empleados.
                                </td>
                            </tr>
                        ) : (
                            empleados.map(emp => (
                                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{emp.nombre}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                                        {emp.usuario}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{emp.correo}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                                        {emp.documento}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{emp.contacto}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{ROL_LABELS[emp.rol]}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <StatusBadge estado={emp.estado} />
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                                        {emp.fechaRegistro}
                                    </td>
                                    {puedeEditar && (
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => abrirEdicion(emp)}
                                                aria-label={`Editar empleado ${emp.nombre}`}
                                                title="Editar empleado"
                                                className="data-table-action focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16.862 4.487 2.651 2.651M7 17l4-1 9.513-9.513a1.875 1.875 0 0 0-2.652-2.652L8.348 13.348 7 17Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setErrorServidor('')
                                                    setEmpleadoEliminando(emp)
                                                }}
                                                aria-label={`Eliminar empleado ${emp.nombre}`}
                                                title="Eliminar empleado"
                                                className="data-table-action text-red-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" />
                                                </svg>
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
                    {empleados.length} {empleados.length === 1 ? 'empleado' : 'empleados'}
                </div>
            </div>

            {/* Modal Registrar empleado */}
            {modalAbierto && (
                <Modal title="Registrar empleado" onClose={cerrarModal} size="lg">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Nombre completo *" error={errores.nombre}>
                            <input type="text" value={form.nombre} onChange={f('nombre')} className={inputCls(!!errores.nombre)} placeholder="Ej. Juan Pérez" />
                        </Field>
                        <Field label="Correo electrónico *" error={errores.correo}>
                            <input type="email" value={form.correo} onChange={f('correo')} className={inputCls(!!errores.correo)} placeholder="correo@empresa.com" />
                        </Field>
                        <Field label="Documento de empleado *" error={errores.documento}>
                            <input type="text" value={form.documento} onChange={f('documento')} className={inputCls(!!errores.documento)} placeholder="Número de documento" />
                        </Field>
                        <Field label="Nombre de usuario *" error={errores.usuario}>
                            <input type="text" value={form.usuario} onChange={f('usuario')} className={inputCls(!!errores.usuario)} placeholder="usuario123" />
                        </Field>
                        <Field label="Contacto *" error={errores.contacto}>
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={form.contacto}
                                onChange={e => setForm(prev => ({ ...prev, contacto: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                className={inputCls(!!errores.contacto)}
                                placeholder="Número de 10 dígitos"
                            />
                        </Field>
                        <Field label="Rol *">
                            <select value={form.rol} onChange={f('rol')} className={inputCls(false)}>
                                {ROLES_SPRINT1.map(r => (
                                    <option key={r} value={r}>{ROL_FULL_LABELS[r]}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Contraseña *" error={errores.contrasena}>
                            <input type="password" value={form.contrasena} onChange={f('contrasena')} className={inputCls(!!errores.contrasena)} placeholder="••••••••" />
                        </Field>
                        <Field label="Confirmar contraseña *" error={errores.confirmarContrasena}>
                            <input type="password" value={form.confirmarContrasena} onChange={f('confirmarContrasena')} className={inputCls(!!errores.confirmarContrasena)} placeholder="••••••••" />
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
                            {enviando ? 'Registrando...' : 'Registrar empleado'}
                        </button>
                    </div>
                </Modal>
            )}
            {empleadoEditando && (
                <Modal title={`Editar empleado: ${empleadoEditando.nombre}`} onClose={() => setEmpleadoEditando(null)} size="lg">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Correo electrónico *" error={errores.correoEdicion}>
                            <input
                                type="email"
                                value={formEdicion.correo}
                                onChange={fEdicion('correo')}
                                className={inputCls(!!errores.correoEdicion)}
                                placeholder="correo@empresa.com"
                            />
                        </Field>
                        <Field label="Contacto *" error={errores.contactoEdicion}>
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={formEdicion.contacto}
                                onChange={e => setFormEdicion(prev => ({
                                    ...prev,
                                    contacto: e.target.value.replace(/\D/g, '').slice(0, 10),
                                }))}
                                className={inputCls(!!errores.contactoEdicion)}
                                placeholder="Número de 10 dígitos"
                            />
                        </Field>
                        <Field label="Rol *" fullWidth>
                            <select value={formEdicion.rol} onChange={fEdicion('rol')} className={inputCls(false)}>
                                {ROLES_SPRINT1.map(rol => (
                                    <option key={rol} value={rol}>{ROL_FULL_LABELS[rol]}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    {errorServidor && (
                        <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                            {errorServidor}
                        </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setEmpleadoEditando(null)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={guardarEdicion}
                            disabled={enviando}
                            className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: '#1e3a5f' }}
                        >
                            {enviando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </Modal>
            )}
            {empleadoEliminando && (
                <Modal title="Eliminar empleado" onClose={() => setEmpleadoEliminando(null)} size="md">
                    <p className="text-sm text-slate-600">
                        ¿Seguro que deseas eliminar a <span className="font-semibold text-slate-900">{empleadoEliminando.nombre}</span>?
                        Esta acción no se puede deshacer.
                    </p>
                    {errorServidor && (
                        <div role="alert" className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                            {errorServidor}
                        </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setEmpleadoEliminando(null)}
                            disabled={enviando}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-60"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={eliminarEmpleado}
                            disabled={enviando}
                            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                        >
                            {enviando ? 'Eliminando...' : 'Eliminar empleado'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}

function Field({ label, error, children, fullWidth }) {
    return (
        <div className={fullWidth ? 'col-span-2' : ''}>
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