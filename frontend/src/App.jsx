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
            const respuesta = await fetch('http://localhost:8080/auth/users', {
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
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        setAutenticado(false)
        setUsuario(null)
    }

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
