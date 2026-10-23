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
  activo: true,
};

const TITULOS = {
  crear: 'Crear inventario',
  entrada: 'Registrar entrada',
  salida: 'Registrar salida',
  editar: 'Editar inventario',
};

const MENSAJES = {
  crear: 'Inventario creado exitosamente.',
  entrada: 'Entrada registrada exitosamente.',
  despacho: 'Despacho registrado: las unidades salieron del CD y entraron a la tienda.',
  editar: 'Inventario actualizado exitosamente.',
};

// Etiqueta y color de cada tipo de movimiento
const TIPO_MOV = {
  ENTRADA: ['Entrada', 'bg-green-50 text-green-700'],
  SALIDA: ['Salida', 'bg-orange-50 text-orange-700'],
  VENTA: ['Venta', 'bg-blue-50 text-blue-700'],
};

// /api/tiendas devuelve el encargado como UserInfo (campo "name")
const nombreEncargado = (u) => u?.encargado?.name ?? u?.encargado?.nombre ?? 'Sin encargado asignado';

// Un CD está abierto si su estado no es INACTIVO; una tienda, si activa no es false
const cdAbierto = (c) => c.estado !== 'INACTIVO';

// HUS-02:
//  - puedeAdministrar (admin): crear y editar inventarios; en Gestión ve la tabla de inventarios creados
//  - puedeMoverStock (admin y encargado de CD): entradas y salidas
//  - los encargados ven "Mi inventario"; el encargado de CD ve en Gestión los movimientos de su CD
export default function Inventario({ puedeAdministrar = false, puedeMoverStock = false }) {
  const verMiInventario = !puedeAdministrar;
  const verGestion = puedeMoverStock;
  const verMisMovimientos = verGestion && !puedeAdministrar; // encargado de CD

  const [pestana, setPestana] = useState(verMiInventario ? 'mio' : 'gestion');

  // ----- Mi inventario -----
  const [mio, setMio] = useState(null);
  const [errorMio, setErrorMio] = useState('');

  // ----- Movimientos de mi inventario (encargado de CD) -----
  const [misMovimientos, setMisMovimientos] = useState([]);
  const [errorMov, setErrorMov] = useState('');

  // ----- Gestión -----
  const [inventarios, setInventarios] = useState([]);
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
  const usuarioActual = localStorage.getItem('username');
  const headers = { Authorization: `Bearer ${token}` };

  // ---------- CARGA DE DATOS ----------

  // Mi inventario: el backend decide la ubicación según el usuario del token
  const cargarMio = async () => {
    setErrorMio('');
    try {
      const res = await fetch(`${API}/api/inventario/mio`, { headers });
      if (res.ok) {
        setMio(await res.json());
      } else if (res.status === 404) {
        setMio(null);
        setErrorMio(await res.text());
      } else {
        throw new Error();
      }
    } catch {
      setErrorMio('No se pudo cargar tu inventario. Si la sesión venció, cierra sesión y vuelve a entrar.');
    }
  };

  // Movimientos del CD del encargado: también los filtra el backend
  const cargarMisMovimientos = async () => {
    setErrorMov('');
    try {
      const res = await fetch(`${API}/api/inventario/mio/movimientos`, { headers });
      if (res.ok) {
        setMisMovimientos(await res.json());
      } else if (res.status === 404) {
        setMisMovimientos([]);
        setErrorMov(await res.text());
      } else {
        throw new Error();
      }
    } catch {
      setErrorMov('No se pudieron cargar los movimientos. Si la sesión venció, cierra sesión y vuelve a entrar.');
    }
  };

  // Filas de productos por ubicación: sirven para calcular la ocupación y para la salida
  const cargarDatos = async () => {
    setError('');
    try {
      const res = await fetch(`${API}/api/inventario`, { headers });
      if (!res.ok) throw new Error();
      setInventarios(await res.json());
    } catch {
      setError('No se pudo cargar el inventario. Si la sesión venció, cierra sesión y vuelve a entrar.');
    }
  };

  // CD y tiendas (con su capacidad y estado) y productos activos
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
    if (verMiInventario) cargarMio();
    if (verMisMovimientos) cargarMisMovimientos();
    if (verGestion) {
      cargarDatos();
      cargarCatalogos();
    }
  }, [verMiInventario, verGestion, verMisMovimientos]);

  // ---------- CÁLCULOS ----------

  // Total de unidades de una ubicación, sumando todos sus productos
  const totalEn = (tipo, id) =>
      inventarios
          .filter((inv) => (tipo === 'CD' ? inv.centroDistribucion?.id === id : inv.tienda?.id === id))
          .reduce((suma, inv) => suma + (inv.cantidad || 0), 0);

  // El admin gestiona todos los CD; el encargado de CD solo el suyo (el backend igual lo valida)
  const centrosVisibles = puedeAdministrar
      ? centros
      : centros.filter((c) => c.encargado?.username === usuarioActual);

  // Tabla de gestión del admin: CD y tiendas que ya tienen inventario creado
  const inventariosCreados = [
    ...centros
        .filter((c) => c.capacidadMaxima != null)
        .map((c) => ({ ...c, tipoUb: 'CD', abierta: cdAbierto(c) })),
    ...tiendas
        .filter((t) => t.capacidadMaxima != null)
        .map((t) => ({ ...t, tipoUb: 'Tienda', abierta: t.activa !== false })),
  ];

  const listaPorTipo = form.tipo === 'CD' ? centros : tiendas;

  // Crear: ubicaciones sin inventario. Entrada: CD abiertos con inventario. Salida: CD abiertos.
  const ubicaciones =
      modal === 'crear'
          ? listaPorTipo.filter((u) => u.capacidadMaxima == null)
          : modal === 'entrada'
              ? centrosVisibles.filter((c) => c.capacidadMaxima != null && cdAbierto(c))
              : centrosVisibles.filter(cdAbierto);

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

  // Editar: el modal se abre con los datos actuales de la ubicación
  const abrirEditar = (u) => {
    setForm({
      ...FORM_INICIAL,
      tipo: u.tipoUb,
      ubicacionId: String(u.id),
      capacidadMinima: String(u.capacidadMinima ?? ''),
      capacidadMaxima: String(u.capacidadMaxima ?? ''),
      activo: u.abierta,
    });
    setErrorModal('');
    setMensaje('');
    setModal('editar');
  };

  const cerrarModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const nuevo = { ...prev, [name]: type === 'checkbox' ? checked : value };
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
    let metodo = 'POST';

    if (modal === 'crear' || modal === 'editar') {
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
      if (modal === 'editar') {
        metodo = 'PUT';
        body.activo = form.activo;
      }
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
        method: metodo,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMensaje(modal === 'salida' ? MENSAJES.despacho : MENSAJES[modal]);
        // crear y editar cambian la capacidad o el estado guardados en el CD o la tienda
        if (modal === 'crear' || modal === 'editar') cargarCatalogos();
        cerrarModal();
        cargarDatos();
        if (verMiInventario) cargarMio(); // la ocupación de "Mi inventario" también cambió
        if (verMisMovimientos) cargarMisMovimientos(); // aparece el movimiento nuevo
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

  const badgeEstado = (abierta) => (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
          abierta ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${abierta ? 'bg-green-500' : 'bg-red-500'}`} />
        {abierta ? 'Activo' : 'Inactivo'}
    </span>
  );

  // ---------- VISTA ----------

  return (
      <div className="p-8">
        <div className="mx-auto w-full max-w-7xl">
          {/* ENCABEZADO */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
              <p className="text-sm text-slate-500 mt-1">
                {verGestion ? 'Inventario de centros de distribución y tiendas' : 'Consulta del inventario de tu tienda'}
              </p>
            </div>
            {pestana === 'gestion' && (
                <div className="flex flex-wrap gap-3">
                  {puedeAdministrar && (
                      <button className="data-table-primary-button" onClick={() => abrirModal('crear')}>
                        + Crear inventario
                      </button>
                  )}
                  {puedeMoverStock && (
                      <>
                        <button className="data-table-primary-button" onClick={() => abrirModal('entrada')}>
                          + Registrar entrada
                        </button>
                        <button className="data-table-primary-button" onClick={() => abrirModal('salida')}>
                          + Registrar salida
                        </button>
                      </>
                  )}
                </div>
            )}
          </div>

          {mensaje && (
              <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                {mensaje}
              </div>
          )}

          {/* PESTAÑAS: solo si el rol tiene las dos */}
          {verMiInventario && verGestion && (
              <div className="flex gap-6 border-b border-slate-200 mb-4">
                <button className={claseTab('mio')} onClick={() => setPestana('mio')}>
                  Mi inventario
                </button>
                <button className={claseTab('gestion')} onClick={() => setPestana('gestion')}>
                  Gestión
                </button>
              </div>
          )}

          {/* ---------- MI INVENTARIO ---------- */}
          {pestana === 'mio' && (
              <>
                {errorMio && (
                    <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                      {errorMio}
                    </div>
                )}

                {mio && (
                    <>
                      {/* Tarjeta de la ubicación */}
                      <div className="data-table-card mb-4 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                              {mio.tipo === 'CD' ? 'Centro de distribución' : 'Tienda'}
                            </p>
                            <h2 className="text-lg font-semibold text-slate-900">{mio.nombre}</h2>
                          </div>
                          {badgeEstado(mio.activa)}
                        </div>

                        {mio.capacidadMaxima == null ? (
                            <p className="mt-4 text-sm text-slate-500">
                              Esta ubicación aún no tiene inventario creado. El administrador debe crearlo.
                            </p>
                        ) : (
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                              <div>
                                <p className="text-xs text-slate-500">Ocupación actual</p>
                                <p className="text-xl font-semibold text-slate-900">
                                  {mio.ocupacion} / {mio.capacidadMaxima}
                                </p>
                                {mio.ocupacion < mio.capacidadMinima && (
                                    <span className="mt-1 inline-block text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                            Stock bajo
                          </span>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Capacidad mínima</p>
                                <p className="text-xl font-semibold text-slate-900">{mio.capacidadMinima}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Capacidad máxima</p>
                                <p className="text-xl font-semibold text-slate-900">{mio.capacidadMaxima}</p>
                              </div>
                            </div>
                        )}
                      </div>

                      {/* Productos de la ubicación */}
                      <div className="data-table-card">
                        <div className="data-table-scroll">
                          <table className="data-table">
                            <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th>ID</th>
                              <th>Producto</th>
                              <th>Categoría</th>
                              <th>Cantidad</th>
                            </tr>
                            </thead>
                            <tbody>
                            {mio.productos.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="text-center text-sm text-slate-400 py-10">
                                    Aún no hay productos en esta ubicación.
                                  </td>
                                </tr>
                            ) : (
                                mio.productos.map((p) => (
                                    <tr key={p.identificador} className="border-b border-slate-100 last:border-0">
                                      <td>{p.identificador}</td>
                                      <td className="font-medium text-slate-900">{p.nombre}</td>
                                      <td>{p.categoria}</td>
                                      <td>
                                        {p.cantidad}
                                        {p.cantidad === 0 && (
                                            <span className="ml-2 text-xs text-red-700 bg-red-50 rounded-full px-2 py-0.5">
                                    Sin existencias
                                  </span>
                                        )}
                                      </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                )}
              </>
          )}

          {/* ---------- GESTIÓN ---------- */}
          {pestana === 'gestion' && verGestion && (
              <>
                {error && (
                    <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                      {error}
                    </div>
                )}

                {puedeAdministrar ? (
                    /* Admin: inventarios creados */
                    <div className="data-table-card">
                      <div className="data-table-scroll">
                        <table className="data-table">
                          <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th>Tipo</th>
                            <th>Ubicación</th>
                            <th>Encargado</th>
                            <th>Ocupación</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                          </thead>
                          <tbody>
                          {inventariosCreados.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center text-sm text-slate-400 py-10">
                                  Aún no hay inventarios creados. Usa "Crear inventario" para empezar.
                                </td>
                              </tr>
                          ) : (
                              inventariosCreados.map((u) => {
                                const total = totalEn(u.tipoUb, u.id);
                                return (
                                    <tr key={`${u.tipoUb}-${u.id}`} className="border-b border-slate-100 last:border-0">
                                      <td>{u.tipoUb}</td>
                                      <td className="font-medium text-slate-900">{u.nombre}</td>
                                      <td>{nombreEncargado(u)}</td>
                                      <td>
                                        {total} / {u.capacidadMaxima}
                                        {total < u.capacidadMinima && (
                                            <span className="ml-2 text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                                    Stock bajo
                                  </span>
                                        )}
                                      </td>
                                      <td>{badgeEstado(u.abierta)}</td>
                                      <td>
                                        <button
                                            type="button"
                                            onClick={() => abrirEditar(u)}
                                            aria-label={`Editar inventario de ${u.nombre}`}
                                            title="Editar"
                                            className="data-table-action"
                                        >
                                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16.862 4.487 2.651 2.651M7 17l4-1 9.513-9.513a1.875 1.875 0 0 0-2.652-2.652L8.348 13.348 7 17Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                                          </svg>
                                        </button>
                                      </td>
                                    </tr>
                                );
                              })
                          )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                ) : (
                    /* Encargado de CD: movimientos de su inventario */
                    <>
                      {errorMov && (
                          <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                            {errorMov}
                          </div>
                      )}
                      <h2 className="mb-3 text-sm font-semibold text-slate-700">Movimientos de mi inventario</h2>
                      <div className="data-table-card">
                        <div className="data-table-scroll">
                          <table className="data-table">
                            <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th>Fecha y hora</th>
                              <th>Tipo</th>
                              <th>ID</th>
                              <th>Producto</th>
                              <th>Cantidad</th>
                            </tr>
                            </thead>
                            <tbody>
                            {misMovimientos.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="text-center text-sm text-slate-400 py-10">
                                    Aún no hay movimientos en tu centro de distribución.
                                  </td>
                                </tr>
                            ) : (
                                misMovimientos.map((m) => {
                                  const [etiquetaTipo, claseTipo] = TIPO_MOV[m.tipo] ?? [m.tipo, 'bg-slate-100 text-slate-700'];
                                  return (
                                      <tr key={m.id} className="border-b border-slate-100 last:border-0">
                                        <td>{new Date(m.fecha).toLocaleString('es-CO')}</td>
                                        <td>
                                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${claseTipo}`}>
                                    {etiquetaTipo}
                                  </span>
                                        </td>
                                        <td>{m.identificador}</td>
                                        <td className="font-medium text-slate-900">{m.producto}</td>
                                        <td>{m.cantidad}</td>
                                      </tr>
                                  );
                                })
                            )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                )}
              </>
          )}
        </div>

        {/* MODAL: CREAR / ENTRADA / SALIDA / EDITAR */}
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

                  {/* Ubicación: al editar se muestra fija (no se puede cambiar) */}
                  {modal === 'editar' ? (
                      <div>
                        <label className={etiqueta}>{form.tipo === 'CD' ? 'Centro de distribución' : 'Tienda'}</label>
                        <input
                            type="text"
                            value={ubicacionSel?.nombre ?? ''}
                            disabled
                            className={`${campo} bg-slate-50 text-slate-500`}
                        />
                        {ubicacionSel && (
                            <p className={ayuda}>
                              Ocupación actual: {totalEn(form.tipo, ubicacionSel.id)} unidades. El máximo no puede ser menor.
                            </p>
                        )}
                      </div>
                  ) : (
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
                            <p className={ayuda}>Todas las ubicaciones de este tipo ya tienen inventario creado.</p>
                        )}
                        {modal === 'entrada' && ubicaciones.length === 0 && (
                            <p className={ayuda}>
                              {puedeAdministrar
                                  ? 'Ningún CD abierto tiene inventario creado. Primero usa "Crear inventario".'
                                  : 'Tu CD no tiene inventario creado o está inactivo.'}
                            </p>
                        )}
                        {modal === 'entrada' && ubicacionSel && (
                            <p className={ayuda}>
                              Ocupación: {totalEn('CD', ubicacionSel.id)} / {ubicacionSel.capacidadMaxima} unidades
                              (espacio disponible: {Math.max(0, ubicacionSel.capacidadMaxima - totalEn('CD', ubicacionSel.id))})
                            </p>
                        )}
                      </div>
                  )}

                  {/* CREAR y EDITAR: encargado y capacidad */}
                  {(modal === 'crear' || modal === 'editar') && (
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

                  {/* EDITAR: abrir o cerrar la ubicación */}
                  {modal === 'editar' && (
                      <div>
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                          Activar/desactivar
                        </label>
                        {!form.activo && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                              {form.tipo === 'CD'
                                  ? 'Al desactivar el CD no se podrán registrar entradas ni despachos, y se le quitará el encargado asignado.'
                                  : 'Al desactivar la tienda no podrá recibir despachos ni registrar ventas.'}
                            </p>
                        )}
                      </div>
                  )}

                  {/* ENTRADA y SALIDA: producto */}
                  {(modal === 'entrada' || modal === 'salida') && (
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
                  {(modal === 'entrada' || modal === 'salida') && (
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
                      {guardando
                          ? 'Guardando...'
                          : modal === 'crear'
                              ? 'Crear'
                              : modal === 'editar'
                                  ? 'Guardar cambios'
                                  : 'Registrar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}