import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL;

const FORM_INICIAL = {
  tipo: 'CD',
  ubicacionId: '',
  productoId: '',
  cantidad: '',
  tiendaDestinoId: '',
  capacidadMinima: '',
  capacidadMaxima: '',
};

const TITULOS = {
  crear: 'Crear inventario',
  entrada: 'Registrar entrada',
  salida: 'Registrar salida',
};

const MENSAJES = {
  crear: 'Inventario creado exitosamente.',
  entrada: 'Entrada registrada exitosamente.',
  despacho: 'Despacho registrado: las unidades salieron del CD y entraron a la tienda.',
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

// /api/tiendas devuelve el encargado como UserInfo (campo "name")
const nombreEncargado = (u) => u?.encargado?.name ?? u?.encargado?.nombre ?? 'Sin encargado asignado';

export default function Inventario() {
  const [pestana, setPestana] = useState('inventario');
  const [inventarios, setInventarios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [centros, setCentros] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [modal, setModal] = useState(null);
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

  // ---------- CÁLCULOS ----------

  // Total de unidades de una ubicación, sumando todos sus productos
  const totalEn = (tipo, id) =>
      inventarios
          .filter((inv) => (tipo === 'CD' ? inv.centroDistribucion?.id === id : inv.tienda?.id === id))
          .reduce((suma, inv) => suma + (inv.cantidad || 0), 0);

  const listaPorTipo = form.tipo === 'CD' ? centros : tiendas;

  // Crear: solo ubicaciones sin inventario. Entrada: solo CD con inventario. Salida: todos los CD.
  const ubicaciones =
      modal === 'crear'
          ? listaPorTipo.filter((u) => u.capacidadMaxima == null)
          : modal === 'entrada'
              ? listaPorTipo.filter((u) => u.capacidadMaxima != null)
              : listaPorTipo;

  const ubicacionSel = listaPorTipo.find((u) => u.id === Number(form.ubicacionId));

  // Salida desde CD = despacho: solo las tiendas activas de ese CD
  const tiendasDestino = tiendas.filter(
      (t) => t.centroDistribucion?.id === Number(form.ubicacionId) && t.activa !== false
  );

  // En la salida solo se listan los productos que el CD ya tiene
  const inventariosUbicacion = inventarios.filter(
      (inv) => inv.centroDistribucion?.id === Number(form.ubicacionId)
  );

  // ---------- MODAL ----------

  const abrirModal = (tipoModal) => {
    setForm(FORM_INICIAL);
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
        nuevo.tiendaDestinoId = '';
      }
      if (name === 'ubicacionId') {
        // los productos y las tiendas destino dependen de la ubicación elegida
        nuevo.productoId = '';
        nuevo.tiendaDestinoId = '';
      }
      return nuevo;
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setErrorModal('');

    let url;
    let body;

    if (modal === 'crear') {
      const min = Number(form.capacidadMinima);
      const max = Number(form.capacidadMaxima);
      if (!form.ubicacionId || form.capacidadMinima === '' || form.capacidadMaxima === '') {
        setErrorModal('Todos los campos son obligatorios.');
        return;
      }
      if (min < 0) {
        setErrorModal('La capacidad mínima no puede ser negativa.');
        return;
      }
      if (max <= min) {
        setErrorModal('La capacidad máxima debe ser mayor que la mínima.');
        return;
      }
      url = `${API}/api/inventario/capacidad`;
      body = {
        tipo: form.tipo === 'CD' ? 'CD' : 'TIENDA',
        ubicacionId: Number(form.ubicacionId),
        capacidadMinima: min,
        capacidadMaxima: max,
      };
    } else {
      if (!form.ubicacionId || !form.productoId || form.cantidad === '') {
        setErrorModal('Todos los campos son obligatorios.');
        return;
      }
      if (Number(form.cantidad) <= 0) {
        setErrorModal('La cantidad debe ser mayor a 0.');
        return;
      }

      if (modal === 'entrada') {
        url = `${API}/api/inventario/entradas`;
        body = {
          centroId: Number(form.ubicacionId),
          productoId: Number(form.productoId),
          cantidad: Number(form.cantidad),
        };
      } else {
        if (!form.tiendaDestinoId) {
          setErrorModal('Selecciona la tienda destino.');
          return;
        }
        const inv = inventarios.find((i) => i.id === Number(form.productoId));
        if (Number(form.cantidad) > (inv?.cantidad ?? 0)) {
          setErrorModal(`Solo hay ${inv?.cantidad ?? 0} unidades disponibles.`);
          return;
        }
        url = `${API}/api/inventario/despachos`;
        body = {
          inventarioId: Number(form.productoId),
          tiendaId: Number(form.tiendaDestinoId),
          cantidad: Number(form.cantidad),
        };
      }
    }

    setGuardando(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 201) {
        setMensaje(modal === 'salida' ? MENSAJES.despacho : MENSAJES[modal]);
        if (modal === 'crear') cargarCatalogos(); // la capacidad quedó guardada en el CD o la tienda
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

  const etiqueta = 'block text-sm font-medium text-slate-700 mb-1.5';
  const campo =
      'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10';
  const ayuda = 'text-xs text-slate-500 mt-1.5';

  // ---------- VISTA ----------

  return (
      <div className="p-8">
        <div className="mx-auto w-full max-w-7xl">
          {/* ENCABEZADO */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
              <p className="text-sm text-slate-500 mt-1">Inventario de centros de distribución y tiendas</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="data-table-primary-button" onClick={() => abrirModal('crear')}>
                + Crear inventario
              </button>
              <button className="data-table-primary-button" onClick={() => abrirModal('entrada')}>
                + Registrar entrada
              </button>
              <button className="data-table-primary-button" onClick={() => abrirModal('salida')}>
                + Registrar salida
              </button>
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

          <div className="data-table-card">
            <div className="data-table-scroll">
              {pestana === 'inventario' ? (
                  <table className="data-table">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th>Tipo</th>
                      <th>Ubicación</th>
                      <th>ID</th>
                      <th>Producto</th>
                      <th>Cantidad disponible</th>
                    </tr>
                    </thead>
                    <tbody>
                    {inventarios.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-sm text-slate-400 py-10">
                            Aún no hay productos en inventario. Crea el inventario de un CD y registra una entrada.
                          </td>
                        </tr>
                    ) : (
                        inventarios.map((inv) => {
                          const ub = ubicacion(inv);
                          return (
                              <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                                <td>{ub.tipo}</td>
                                <td>{ub.nombre}</td>
                                <td>{inv.producto.identificador}</td>
                                <td className="font-medium text-slate-900">{inv.producto.nombre}</td>
                                <td>
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
                  <table className="data-table">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th>Fecha y hora</th>
                      <th>Tipo</th>
                      <th>Ubicación</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
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
                                <td>{new Date(m.fecha).toLocaleString('es-CO')}</td>
                                <td>
                          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${claseTipo}`}>
                            {etiquetaTipo}
                          </span>
                                </td>
                                <td>
                                  {ub.tipo} - {ub.nombre}
                                </td>
                                <td className="font-medium text-slate-900">{m.inventario.producto.nombre}</td>
                                <td>{m.cantidad}</td>
                              </tr>
                          );
                        })
                    )}
                    </tbody>
                  </table>
              )}
            </div>
          </div>
        </div>

        {/* MODAL: CREAR INVENTARIO / REGISTRAR ENTRADA / REGISTRAR SALIDA */}
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

                  {/* Tipo: solo al crear. Entradas y salidas son siempre de un CD: el stock
                  de una tienda solo entra por despacho y solo sale por ventas */}
                  {modal === 'crear' && (
                      <div>
                        <label htmlFor="tipo" className={etiqueta}>Tipo</label>
                        <select id="tipo" name="tipo" value={form.tipo} onChange={handleChange} className={campo}>
                          <option value="CD">Centro de distribución</option>
                          <option value="Tienda">Tienda</option>
                        </select>
                      </div>
                  )}

                  {/* Ubicación */}
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
                    {modal === 'crear' && ubicaciones.length === 0 && (
                        <p className={ayuda}>
                          Todas las ubicaciones de este tipo ya tienen inventario creado.
                        </p>
                    )}
                    {modal === 'entrada' && ubicaciones.length === 0 && (
                        <p className={ayuda}>
                          Ningún CD tiene inventario creado. Primero usa "Crear inventario".
                        </p>
                    )}
                    {modal === 'entrada' && ubicacionSel && (
                        <p className={ayuda}>
                          Ocupación: {totalEn('CD', ubicacionSel.id)} / {ubicacionSel.capacidadMaxima} unidades
                          (espacio disponible: {Math.max(0, ubicacionSel.capacidadMaxima - totalEn('CD', ubicacionSel.id))})
                        </p>
                    )}
                  </div>

                  {/* CREAR: encargado y capacidad */}
                  {modal === 'crear' && (
                      <>
                        <div>
                          <label className={etiqueta}>Encargado</label>
                          <input
                              type="text"
                              value={ubicacionSel ? nombreEncargado(ubicacionSel) : ''}
                              placeholder="Selecciona una ubicación"
                              disabled
                              className={`${campo} bg-slate-50 text-slate-500`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="capacidadMinima" className={etiqueta}>Capacidad mínima</label>
                            <input
                                id="capacidadMinima"
                                type="number"
                                min="0"
                                name="capacidadMinima"
                                value={form.capacidadMinima}
                                onChange={handleChange}
                                placeholder="100"
                                className={campo}
                            />
                          </div>
                          <div>
                            <label htmlFor="capacidadMaxima" className={etiqueta}>Capacidad máxima</label>
                            <input
                                id="capacidadMaxima"
                                type="number"
                                min="1"
                                name="capacidadMaxima"
                                value={form.capacidadMaxima}
                                onChange={handleChange}
                                placeholder="1000"
                                className={campo}
                            />
                          </div>
                        </div>
                        <p className={ayuda}>
                          Total de artículos de la ubicación, sumando todos los productos. Por debajo del mínimo
                          se considera stock bajo; el máximo no se puede superar.
                        </p>
                      </>
                  )}

                  {/* ENTRADA y SALIDA: producto */}
                  {modal !== 'crear' && (
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
                          {modal === 'entrada'
                              ? productos.map((p) => (
                                  <option key={p.idProducto} value={p.idProducto}>
                                    {p.identificador} - {p.nombre}
                                  </option>
                              ))
                              : inventariosUbicacion.map((inv) => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.producto.identificador} - {inv.producto.nombre} (disponible: {inv.cantidad})
                                  </option>
                              ))}
                        </select>
                        {modal === 'salida' && form.ubicacionId && inventariosUbicacion.length === 0 && (
                            <p className={ayuda}>Este CD no tiene productos. Primero registra una entrada.</p>
                        )}
                      </div>
                  )}

                  {/* SALIDA: tienda destino */}
                  {modal === 'salida' && (
                      <div>
                        <label htmlFor="tiendaDestinoId" className={etiqueta}>Tienda destino *</label>
                        <select
                            id="tiendaDestinoId"
                            name="tiendaDestinoId"
                            value={form.tiendaDestinoId}
                            onChange={handleChange}
                            className={campo}
                        >
                          <option value="">Selecciona la tienda que recibe</option>
                          {tiendasDestino.map((t) => (
                              <option key={t.id} value={t.id} disabled={t.capacidadMaxima == null}>
                                {t.capacidadMaxima == null
                                    ? `${t.nombre} (sin inventario creado)`
                                    : `${t.nombre} (${totalEn('Tienda', t.id)} / ${t.capacidadMaxima})`}
                              </option>
                          ))}
                        </select>
                        {form.ubicacionId && tiendasDestino.length === 0 && (
                            <p className={ayuda}>Este CD no tiene tiendas activas asociadas.</p>
                        )}
                      </div>
                  )}

                  {/* ENTRADA y SALIDA: cantidad */}
                  {modal !== 'crear' && (
                      <div>
                        <label htmlFor="cantidad" className={etiqueta}>Cantidad</label>
                        <input
                            id="cantidad"
                            type="number"
                            min="1"
                            name="cantidad"
                            value={form.cantidad}
                            onChange={handleChange}
                            placeholder="0"
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