import { useState } from 'react'
import Layout from './components/Layout'
import Empleados from './pages/Empleados'

// Temporal: mientras no exista el login real, usamos un usuario fijo.
const USUARIO_TEMPORAL = { nombre: 'Administrador del Sistema' }

export default function App() {
    const [view, setView] = useState('empleados')
    const [empleados, setEmpleados] = useState([])

    const renderView = () => {
        if (view === 'empleados') {
            return <Empleados empleados={empleados} onChange={setEmpleados} />
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
            onLogout={() => {}}
            usuario={USUARIO_TEMPORAL}
        >
            {renderView()}
        </Layout>
    )
}