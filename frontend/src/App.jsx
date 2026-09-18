import React, { useState } from 'react';
import Login from './login';
import Productos from './components/Productos'; // Asegúrate de que la ruta coincida con donde creaste el archivo

function App() {
  // Leemos si ya hay un token guardado en el navegador
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Función para cerrar sesión (Historia de Usuario 1.2)
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Si hay token, mostramos Productos. Si no, mostramos Login */}
      {token ? (
        <>
          {/* Barra superior para poder cerrar sesión */}
          <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
            <span className="font-bold text-lg">Sistema Zara - AyD2</span>
            <button 
              onClick={handleLogout} 
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </nav>
          
          {/* Pantalla principal de la historia 3.1 */}
          <Productos />
        </>
      ) : (
        <Login setToken={setToken} />
      )}
    </div>
  );
}

export default App;