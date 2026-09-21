import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Empleados from './pages/Empleados'
import Tiendas from './Tiendas'
import Login from './login'
import CentrosDistribucion from './pages/CentrosDistribucion'

function App() {
  const [vista, setVista] = useState('tiendas');

  return vista === 'productos' ? (
    <Productos onNavigate={setVista} />
  ) : (
    <Tiendas onNavigate={setVista} />
  );
}

    if (!autenticado) {
        return <Login onLoginSuccess={(username) => {
            setUsuario({ nombre: username })
            setAutenticado(true)
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
