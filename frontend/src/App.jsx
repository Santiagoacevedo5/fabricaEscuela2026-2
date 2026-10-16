import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Empleados from './pages/Empleados'
import Tiendas from './Tiendas'
import Login from './login'
import CentrosDistribucion from './pages/CentrosDistribucion'
import Productos from './components/Productos'

export default function App() {
    const [autenticado, setAutenticado] = useState(false)
    const [usuario, setUsuario] = useState(null)
    const [view, setView] = useState('empleados')
    const [empleados, setEmpleados] = useState([])

    useEffect(() => {
        const token = localStorage.getItem('token')
        const username = localStorage.getItem('username')
        if (token) {
            setAutenticado(true)
            setUsuario({ nombre: username || 'Usuario' })
            cargarEmpleados(token)
        }
    }, [])

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
            setUsuario({ nombre: username })
            setAutenticado(true)
            const token = localStorage.getItem('token')
            cargarEmpleados(token)
        }} />
    }

    const renderView = () => {
        if (view === 'empleados') {
            return <Empleados empleados={empleados} onChange={setEmpleados} />
        }
        if (view === 'tiendas') {
            return <Tiendas />
        }
        if (view === 'centros'){
            return <CentrosDistribucion />;
            }
        if (view === 'productos'){
            return <Productos />;
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
