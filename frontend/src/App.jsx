import { useState, useEffect } from 'react'
import Layout from './components/layout'
import Empleados from './pages/Empleados'
import Tiendas from './Tiendas'
import Login from './login'
import CentrosDistribucion from './pages/CentrosDistribucion'
import Productos from './components/Productos'
import Inventario from './pages/Inventario'
import Ventas from './pages/Ventas'

const cargarUsuario = async (token) => {
    const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!respuesta.ok) {
        throw new Error(`No se pudo cargar el usuario (${respuesta.status}).`)
    }
    return respuesta.json()
}

export default function App() {
    const [autenticado, setAutenticado] = useState(false)
    const [usuario, setUsuario] = useState(null)
    const [view, setView] = useState('empleados')
    const [empleados, setEmpleados] = useState([])

    // HUS-02: permisos del usuario logueado (la protección real está en el backend)
    const tieneRol = (...roles) => usuario?.roles?.some((rol) => roles.includes(rol)) ?? false
    const esAdmin = tieneRol('ROLE_ADMIN')
    const esEncargadoCd = tieneRol('ENCARGADO_CD')

    // Carga el usuario y, solo si es admin, la lista de empleados (/auth/users es solo de admin)
    const iniciarSesion = (token, username) => {
        setUsuario({ nombre: username || 'Usuario', roles: [] })
        cargarUsuario(token)
            .then((datos) => {
                setUsuario({ nombre: datos.username, roles: datos.roles })
                if (datos.roles?.includes('ROLE_ADMIN')) {
                    cargarEmpleados(token)
                }
            })
            .catch((err) => {
                console.error('Error al cargar el usuario:', err)
                setUsuario({ nombre: username || 'Usuario', roles: [] })
            })
    }

    useEffect(() => {
        const token = localStorage.getItem('token')
        const username = localStorage.getItem('username')
        if (token) {
            setAutenticado(true)
            iniciarSesion(token, username)
        }
    }, [])

    // Si la vista actual no está permitida para el rol (p. ej. un encargado en Empleados), ir a Inventario
    useEffect(() => {
        if (!usuario?.roles?.length) return
        const permitida =
            (view !== 'empleados' || esAdmin) &&
            (view !== 'ventas' || tieneRol('ROLE_ADMIN', 'ENCARGADO_TIENDA'))
        if (!permitida) setView('inventario')
    }, [usuario, view])

    const cargarEmpleados = async (token) => {
        try {
            const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!respuesta.ok) {
                console.error('Error al cargar empleados:', respuesta.status)
                return
            }
            const datos = await respuesta.json()
            const empleadosMapeados = datos.map(emp => ({
                id: emp.id,
                nombre: emp.name,
                correo: emp.email,
                documento: emp.documento,
                contacto: emp.contacto,
                usuario: emp.username,
                rol: emp.roles,
                estado: (emp.estado || '').toLowerCase(),
                fechaRegistro: emp.fechaRegistro,
            }))
            setEmpleados(empleadosMapeados)
        } catch (err) {
            console.error('Error al conectar con el servidor:', err)
        }
    }

    const handleLogout = () => {
        const token = localStorage.getItem('token')
        if (token) {
            fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                keepalive: true,
            }).catch(err => console.error('Error al invalidar el token:', err))
        }
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        setAutenticado(false)
        setUsuario(null)
        setEmpleados([])
        setView('empleados')
    }

    // Si el token desaparece (logout en otra pestaña o página restaurada con "atrás"), volver al login
    useEffect(() => {
        const verificarSesion = () => {
            if (!localStorage.getItem('token')) {
                setAutenticado(false)
                setUsuario(null)
                setEmpleados([])
            }
        }
        window.addEventListener('pageshow', verificarSesion)
        window.addEventListener('storage', verificarSesion)
        return () => {
            window.removeEventListener('pageshow', verificarSesion)
            window.removeEventListener('storage', verificarSesion)
        }
    }, [])

    if (!autenticado) {
        return <Login onLoginSuccess={(username) => {
            setAutenticado(true)
            iniciarSesion(localStorage.getItem('token'), username)
        }} />
    }

    const renderView = () => {
        if (view === 'empleados' && esAdmin) {
            return <Empleados
                empleados={empleados}
                onChange={setEmpleados}
                puedeEditar={esAdmin}
            />
        }
        if (view === 'tiendas') {
            return <Tiendas puedeEditar={esAdmin} />
        }
        if (view === 'centros') {
            return <CentrosDistribucion puedeEditar={esAdmin} />
        }
        if (view === 'productos') {
            return <Productos puedeEditar={esAdmin || esEncargadoCd} />
        }
        if (view === 'inventario') {
            return <Inventario
                puedeAdministrar={esAdmin}
                puedeMoverStock={esAdmin || esEncargadoCd}
            />
        }
        if (view === 'ventas' && tieneRol('ROLE_ADMIN', 'ENCARGADO_TIENDA')) {
            return <Ventas esAdmin={esAdmin} />
        }

        return (
            <div className="p-6 text-sm text-slate-500">
                Esta función aún está en desarrollo.
            </div>
        )
    }

    return (
        <Layout
            currentView={view}
            onViewChange={setView}
            onLogout={handleLogout}
            usuario={usuario}
        >
            {renderView()}
        </Layout>
    )
}