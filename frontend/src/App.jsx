import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Empleados from './pages/Empleados'
import Tiendas from './Tiendas'
import Login from './login'

export default function App() {
    const [autenticado, setAutenticado] = useState(false)
    const [view, setView] = useState('empleados')
    const [empleados, setEmpleados] = useState([])

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            setAutenticado(true)
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        setAutenticado(false)
    }

    if (!autenticado) {
        return <Login onLoginSuccess={() => setAutenticado(true)} />
    }

    const renderView = () => {
        if (view === 'empleados') {
            return <Empleados empleados={empleados} onChange={setEmpleados} />
        }
        if (view === 'tiendas') {
            return <Tiendas />
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
        >
            {renderView()}
        </Layout>
    )
}
