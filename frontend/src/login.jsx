import { useState } from 'react';

// 1. Añadimos { setToken } como prop
function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/auth/generateToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      const token = await response.text();
      localStorage.setItem('token', token);
      
      // 2. Ejecutamos setToken para que App.jsx actualice la vista a Productos
      setToken(token); 
      
      alert('¡Login exitoso!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-950 text-white p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-5 w-5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" y1="22" x2="12" y2="12" />
              </svg>
            </div>
            <span className="text-lg font-bold">WebZaraV.1</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold leading-tight">
            Control total de tu inventario
          </h1>
          <p className="text-blue-300 text-lg">
            Gestiona tiendas, bodegas, centros de distribución y productos desde un único sistema integrado.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-slate-900 p-4">
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-blue-300">Tiendas activas</p>
          </div>
          <div className="rounded-lg bg-slate-900 p-4">
            <p className="text-2xl font-bold">1</p>
            <p className="text-sm text-blue-300">Centros de Distribución</p>
          </div>
          <div className="rounded-lg bg-slate-900 p-4">
            <p className="text-2xl font-bold">248</p>
            <p className="text-sm text-blue-300">Productos</p>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-slate-900">Iniciar sesión</h2>
          <p className="mt-1 text-slate-500">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Usuario
              </label>
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            <p>Acceso restringido · Solo personal autorizado</p>
            <p className="mt-1">
              Demo: <span className="font-mono">admin / Admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;