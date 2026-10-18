import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL;

const FORM_INICIAL = { tipo: 'CD', ubicacionId: '', productoId: '', cantidad: '' };

const TITULOS = {
  crear: 'Crear inventario',
  entrada: 'Registrar entrada',
  salida: 'Registrar salida',
  venta: 'Registrar venta',
};

const MENSAJES = {
  crear: 'Inventario creado exitosamente.',
  entrada: 'Entrada registrada exitosamente.',
  salida: 'Salida registrada exitosamente.',
  venta: 'Venta registrada exitosamente.',
};

// Etiqueta y color de cada tipo de movimiento en la pestaña Movimientos
const TIPO_MOV = {
  ENTRADA: ['Entrada', 'bg-green-50 text-green-700'],
  SALIDA: ['Salida', 'bg-orange-50 text-orange-700'],
  VENTA: ['Venta', 'bg-blue-50 text-blue-700'],
};

// Dice si un inventario es de un CD o de una tienda, y su nombre
const ubicacion = (inv) =>
  inv.centroDistribucion
    ? { tipo: 'CD', nombre: inv.centroDistribucion.nombre }
    : { tipo: 'Tienda', nombre: inv.tienda?.nombre };

export default function Inventario({ puedeRegistrarVenta }) {
  const [pestana, setPestana] = useState('inventario');
  const [inventarios, setInventarios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [centros, setCentros] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [modal, setModal] = useState(null); // 'crear' | 'entrada' | 'salida' | 'venta' | null
  const [form, setForm] = useState(FORM_INICIAL);
  const [errorModal, setErrorModal] = useState('');
  const [guardando, setGuardando] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // ---------- CARGA DE DATOS ----------

  const cargarDatos = async () => {
    setError('');
    try {
      const [resInv, resMov] = await Promise.all([
        fetch(`${API}/api/inventario`, { headers }),
        fetch(`${API}/api/inventario/movimientos`, { headers }),
      ]);
      if (!resInv.ok || !resMov.ok) throw new Error();
      setInventarios(await resInv.json());
      const movs = await resMov.json();
      setMovimientos(movs.sort((a, b) => b.id - a.id)); // más reciente primero
    } catch {
      setError('No se pudo cargar el inventario. Si la sesión venció, cierra sesión y vuelve a entrar.');
    }
  };

  // Listas para los desplegables: CD, tiendas y productos activos
  const cargarCatalogos = async () => {
    try {
      const [resCd, resTi, resPr] = await Promise.all([
        fetch(`${API}/api/centros`, { headers }),
        fetch(`${API}/api/tiendas`, { headers }),
        fetch(`${API}/api/productos`, { headers }),
      ]);
      if (resCd.ok) setCentros(await resCd.json());
      if (resTi.ok) setTiendas(await resTi.json());
      if (resPr.ok) setProductos((await resPr.json()).filter((p) => p.activo));
    } catch {
      setError('No se pudieron cargar los CD, tiendas o productos.');
    }
  };

  useEffect(() => {
    cargarDatos();
    cargarCatalogos();
  }, []);

  // ---------- MODAL ----------

  const hoy = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en hora local

  const abrirModal = (tipoModal) => {
    // la venta siempre es de una tienda, y la fecha arranca en hoy
    setForm(tipoModal === 'venta' ? { ...FORM_INICIAL, tipo: 'Tienda', fecha: hoy } : FORM_INICIAL);
    setErrorModal('');
    setMensaje('');
    setModal(tipoModal);
  };

  const cerrarModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const nuevo = { ...prev, [name]: value };
      if (name === 'tipo') {
        // un id de CD no sirve como id de tienda: se reinicia la selección
        nuevo.ubicacionId = '';
        nuevo.productoId = '';
      }
      if (name === 'ubicacionId') {
        // en entrada/salida/venta la lista de productos depende de la ubicación
        nuevo.productoId = '';
      }
      return nuevo;
    });
  };

  const ubicaciones = form.tipo === 'CD' ? centros : tiendas;
  const esVenta = modal === 'venta';
  const esMovimiento = modal === 'entrada' || modal === 'salida' || esVenta;

  // En entrada/salida/venta solo se listan los productos que ya tienen inventario en esa ubicación
  const inventariosUbicacion = inventarios.filter((inv) =>
    form.tipo === 'CD'
      ? inv.centroDistribucion?.id === Number(form.ubicacionId)
      : inv.tienda?.id === Number(form.ubicacionId)
  );

  const guardar = async (e) => {
    e.preventDefault();
    setErrorModal('');

    if (!form.ubicacionId || !form.productoId || form.cantidad === '' || (esVenta && !form.fecha)) {
      setErrorModal('Todos los campos son obligatorios.');
      return;
    }

    // Salida y venta no pueden superar el stock disponible (el backend también debe validarlo)
    if (modal === 'salida' || esVenta) {
      const inv = inventarios.find((i) => i.id === Number(form.productoId));
      if (Number(form.cantidad) > (inv?.cantidad ?? 0)) {
        setErrorModal(`Solo hay ${inv?.cantidad ?? 0} unidades disponibles.`);
        return;
      }
    }

    // En crear, productoId es el id del producto; en entrada/salida/venta es el id del inventario elegido
    const url = esVenta
      ? `${API}/api/inventario/ventas`
      : esMovimiento
        ? `${API}/api/inventario/movimientos`
        : `${API}/api/inventario`;
    const body = esMovimiento
      ? {
          inventario: { id: Number(form.productoId) },
          tipo: esVenta ? 'VENTA' : modal.toUpperCase(),
          cantidad: Number(form.cantidad),
          // fecha elegida + hora actual, en el formato de un LocalDateTime
          ...(esVenta && { fecha: `${form.fecha}T${new Date().toTimeString().slice(0, 8)}` }),
        }
      : {
          [form.tipo === 'CD' ? 'centroDistribucion' : 'tienda']: { id: Number(form.ubicacionId) },
          producto: { idProducto: Number(form.productoId) },
          cantidad: Number(form.cantidad),
        };

    setGuardando(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 201) {
        setMensaje(MENSAJES[modal]);
        cerrarModal();
        cargarDatos();
      } else {
        setErrorModal((await res.text()) || 'No se pudo guardar. Revisa que la sesión siga activa.');
      }
    } catch {
      setErrorModal('Error de conexión con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  // ---------- ESTILOS ----------

  const claseTab = (nombre) =>
    `pb-2.5 text-sm font-medium border-b-2 transition-colors ${
      pestana === nombre
        ? 'border-[#1e3a5f] text-slate-900'
        : 'border-transparent text-slate-500 hover:text-slate-700'
    }`;

  const claseBoton =
    'flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#254a75] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors';

  const th = 'text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3';
  const td = 'px-5 py-3.5 text-sm text-slate-700';
  const etiqueta = 'block text-sm font-medium text-slate-700 mb-1.5';
  const campo =
    'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10';

  // ---------- VISTA ----------

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* ENCABEZADO */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
            <p className="text-sm text-slate-500 mt-1">Inventario de centros de distribución y tiendas</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={claseBoton} onClick={() => abrirModal('crear')}>
              + Crear inventario
            </button>
            <button className={claseBoton} onClick={() => abrirModal('entrada')}>
              + Registrar entrada
            </button>
            <button className={claseBoton} onClick={() => abrirModal('salida')}>
              + Registrar salida
            </button>
            {puedeRegistrarVenta && (
              <button className={claseBoton} onClick={() => abrirModal('venta')}>
                + Registrar venta
              </button>
            )}
          </div>
        </div>

        {mensaje && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            {mensaje}
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        {/* PESTAÑAS */}
        <div className="flex gap-6 border-b border-slate-200 mb-4">
          <button className={claseTab('inventario')} onClick={() => setPestana('inventario')}>
            Inventario
          </button>
          <button className={claseTab('movimientos')} onClick={() => setPestana('movimientos')}>
            Movimientos
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          {pestana === 'inventario' ? (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className={th}>Tipo</th>
                  <th className={th}>Ubicación</th>
                  <th className={th}>ID</th>
                  <th className={th}>Producto</th>
                  <th className={th}>Cantidad disponible</th>
                </tr>
              </thead>
              <tbody>
                {inventarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-sm text-slate-400 py-10">
                      Aún no hay inventario registrado. Usa "Crear inventario" para empezar.
                    </td>
                  </tr>
                ) : (
                  inventarios.map((inv) => {
                    const ub = ubicacion(inv);
                    return (
                      <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                        <td className={td}>{ub.tipo}</td>
                        <td className={td}>{ub.nombre}</td>
                        <td className={`${td} font-mono text-xs text-slate-500`}>{inv.producto.identificador}</td>
                        <td className={`${td} font-medium text-slate-900`}>{inv.producto.nombre}</td>
                        <td className={td}>
                          {inv.cantidad}
                          {inv.cantidad === 0 && (
                            <span className="ml-2 text-xs text-red-700 bg-red-50 rounded-full px-2 py-0.5">
                              Sin existencias
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className={th}>Fecha y hora</th>
                  <th className={th}>Tipo</th>
                  <th className={th}>Ubicación</th>
                  <th className={th}>Producto</th>
                  <th className={th}>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-sm text-slate-400 py-10">
                      Aún no hay movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => {
                    const ub = ubicacion(m.inventario);
                    const [etiquetaTipo, claseTipo] = TIPO_MOV[m.tipo];
                    return (
                      <tr key={m.id} className="border-b border-slate-100 last:border-0">
                        <td className={td}>{new Date(m.fecha).toLocaleString('es-CO')}</td>
                        <td className={td}>
                          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${claseTipo}`}>
                            {etiquetaTipo}
                          </span>
                        </td>
                        <td className={td}>
                          {ub.tipo} - {ub.nombre}
                        </td>
                        <td className={`${td} font-medium text-slate-900`}>{m.inventario.producto.nombre}</td>
                        <td className={td}>{m.cantidad}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: CREAR INVENTARIO / REGISTRAR ENTRADA / SALIDA / VENTA */}
      {modal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">{TITULOS[modal]}</h2>
              <button
                onClick={cerrarModal}
                aria-label="Cerrar"
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={guardar} className="px-6 py-5 space-y-4">
              {errorModal && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                  {errorModal}
                </div>
              )}

              {modal !== 'venta' && (
                <div>
                  <label htmlFor="tipo" className={etiqueta}>Tipo</label>
                  <select id="tipo" name="tipo" value={form.tipo} onChange={handleChange} className={campo}>
                    <option value="CD">Centro de distribución</option>
                    <option value="Tienda">Tienda</option>
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="ubicacionId" className={etiqueta}>
                  {form.tipo === 'CD' ? 'Centro de distribución' : 'Tienda'}
                </label>
                <select
                  id="ubicacionId"
                  name="ubicacionId"
                  value={form.ubicacionId}
                  onChange={handleChange}
                  className={campo}
                >
                  <option value="">Selecciona una opción</option>
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="productoId" className={etiqueta}>Producto</label>
                <select
                  id="productoId"
                  name="productoId"
                  value={form.productoId}
                  onChange={handleChange}
                  className={campo}
                >
                  <option value="">Selecciona un producto</option>
                  {esMovimiento
                    ? inventariosUbicacion.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.producto.identificador} - {inv.producto.nombre} (disponible: {inv.cantidad})
                        </option>
                      ))
                    : productos.map((p) => (
                        <option key={p.idProducto} value={p.idProducto}>
                          {p.identificador} - {p.nombre}
                        </option>
                      ))}
                </select>
                {esMovimiento && form.ubicacionId && inventariosUbicacion.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Esta ubicación no tiene productos. Primero usa "Crear inventario".
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="cantidad" className={etiqueta}>
                  {esMovimiento ? 'Cantidad' : 'Cantidad inicial'}
                </label>
                <input
                  id="cantidad"
                  type="number"
                  min={esMovimiento ? '1' : '0'}
                  name="cantidad"
                  value={form.cantidad}
                  onChange={handleChange}
                  placeholder="0"
                  className={campo}
                />
              </div>

              {esVenta && (
                <div>
                  <label htmlFor="fecha" className={etiqueta}>Fecha</label>
                  <input
                    id="fecha"
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    max={hoy}
                    onChange={handleChange}
                    className={campo}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2.5 text-sm font-medium bg-[#1e3a5f] hover:bg-[#254a75] text-white rounded-lg transition-colors disabled:opacity-60"
                >
                  {guardando ? 'Guardando...' : modal === 'crear' ? 'Crear' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
