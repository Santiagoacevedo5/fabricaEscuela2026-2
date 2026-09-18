// Ruta: frontend/src/components/Productos.jsx
import React, { useState, useEffect, useMemo } from 'react';

// --- Iconos SVG inline (sin dependencias externas) ---
const IconSearch = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconX = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const FORM_INICIAL = { nombre: '', identificador: '', categoria: '', descripcion: '', activo: true };

const CATEGORIAS_DISPONIBLES = [
  'Camisetas y Tops',
  'Camisas',
  'Pantalones',
  'Jeans',
  'Faldas',
  'Vestidos',
  'Chaquetas y Abrigos',
  'Ropa Interior y Pijamas',
  'Ropa Deportiva',
  'Calzado',
  'Accesorios',
  'Bolsos y Carteras',
  'Cinturones y Bisutería',
  'Punto y Knitwear',
  'Otro'
];

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [formData, setFormData] = useState(FORM_INICIAL);

  const token = localStorage.getItem('token'); // Asumiendo que guardan el JWT aquí al loguearse

  const fetchProductos = async () => {
    setCargando(true);
    try {
      const response = await fetch('http://localhost:8080/api/productos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      }
    } catch (err) {
      console.error('Error cargando productos', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const abrirModalRegistro = () => {
    setFormData(FORM_INICIAL);
    setError('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    try {
      const response = await fetch('http://localhost:8080/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 201) {
        setMensaje('Producto registrado exitosamente.');
        cerrarModal();
        fetchProductos();
      } else {
        const errorText = await response.text();
        setError(errorText || 'No se pudo guardar el producto.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    }
  };

  const categorias = useMemo(
    () => [...new Set(productos.map((p) => p.categoria).filter(Boolean))],
    [productos]
  );

  const productosFiltrados = productos.filter((p) => {
    const q = busqueda.trim().toLowerCase();
    const matchBusqueda = q
      ? p.nombre.toLowerCase().includes(q) ||
        p.identificador.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
      : true;
    const matchCategoria = filtroCategoria ? p.categoria === filtroCategoria : true;
    const matchEstado = filtroEstado ? (filtroEstado === 'activo' ? p.activo : !p.activo) : true;
    return matchBusqueda && matchCategoria && matchEstado;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* ENCABEZADO */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
            <p className="text-sm text-slate-500 mt-1">Catálogo de productos del sistema</p>
          </div>
          <button
            onClick={abrirModalRegistro}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            Registrar producto
          </button>
        </div>

        {mensaje && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            {mensaje}
          </div>
        )}
        {error && !modalAbierto && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        {/* BUSCADOR Y FILTROS */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, código o categoría..."
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
            />
          </div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 sm:min-w-[190px] focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 sm:min-w-[190px] focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        {/* TABLA */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Código</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      Cargando productos...
                    </td>
                  </tr>
                ) : productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      No se encontraron productos con estos filtros.
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p) => (
                    <tr key={p.idProducto} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-sm text-slate-600">{p.identificador}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.nombre}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded">
                          {p.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{p.descripcion}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                            p.activo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PIE / CONTEO */}
        <div className="flex items-center justify-between text-sm text-slate-500 mt-4">
          <span>{productosFiltrados.length} de {productos.length} productos</span>
        </div>
      </div>

      {/* MODAL: REGISTRAR / EDITAR PRODUCTO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Registrar producto</h2>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-600">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5">
              {error && (
                <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Nombre *"
                  required
                  className="col-span-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <input
                  name="identificador"
                  value={formData.identificador}
                  onChange={handleChange}
                  placeholder="Identificador único *"
                  required
                  className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                  className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="" disabled>Categoría *</option>
                  {CATEGORIAS_DISPONIBLES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción"
                  rows={2}
                  className="col-span-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  Producto activo
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
                >
                  Registrar producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}