import { useState } from 'react';
import Tiendas from './Tiendas';
import Productos from './components/Productos';

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
