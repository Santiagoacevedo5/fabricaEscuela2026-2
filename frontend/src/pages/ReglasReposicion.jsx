import { useState, useEffect } from 'react';
import { validarRegla } from '../validarRegla';

const API = import.meta.env.VITE_API_URL;
const URL_REGLAS = `${API}/api/reglas-reposicion`; // shortcut: endpoint supuesto, ajustar al del backend

const FORM_INICIAL = { productoId: '', tiendaId: '', umbralMinimo: '', cantidadReposicion: '', activa: true };

const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

export default function ReglasReposicion() {
  const [reglas, setReglas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null); // regla en edición; null = regla nueva
  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({}); // error por campo
  const [errorModal, setErrorModal] = useState('');
  const [guardando, setGuardando] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // ---------- CARGA DE DATOS ----------

  const cargarReglas = async () => {
    setError('');
    try {
      const res = await fetch(URL_REGLAS, { headers });
      if (!res.ok) throw new Error();
      setReglas(await res.json());
    } catch {
      setError('No se pudieron cargar las reglas. Si la sesión venció, cierra sesión y vuelve a entrar.');
    }
  };

  // Listas para los desplegables: productos activos y tiendas
  const cargarCatalogos = async () => {
    try {
      const [resPr, resTi] = await Promise.all([
        fetch(`${API}/api/productos`, { headers }),
        fetch(`${API}/api/tiendas`, { headers }),
      ]);
      if (resPr.ok) setProductos((await resPr.json()).filter((p) => p.activo));
      if (resTi.ok) setTiendas(await resTi.json());
    } catch {
      setError('No se pudieron cargar los productos o las tiendas.');
    }
  };

  useEffect(() => {
    cargarReglas();
    cargarCatalogos();
  }, []);

  // ---------- MODAL ----------

  const abrirModal = (regla = null) => {
    setEditando(regla);
    setForm(
      regla
        ? {
            productoId: regla.producto.idProducto,
            tiendaId: regla.tienda.id,
            umbralMinimo: regla.umbralMinimo,
            cantidadReposicion: regla.cantidadReposicion,
            activa: regla.activa,
          }
        : FORM_INICIAL
    );
    setErrores({});
    setErrorModal('');
    setMensaje('');
    setModal(true);
  };

  const cerrarModal = () => setModal(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrores((prev) => ({ ...prev, [name]: undefined }));
  };

  // Escenario 3: ya existe una regla para esta combinación (al editar, producto y tienda no cambian)
  const duplicada = !editando
    ? reglas.find((r) => r.producto.idProducto === Number(form.productoId) && r.tienda.id === Number(form.tiendaId))
    : null;

  const guardar = async (e) => {
    e.preventDefault();
    setErrorModal('');

    const nuevos = validarRegla(form);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || duplicada) return;

    const body = {
      producto: { idProducto: Number(form.productoId) },
      tienda: { id: Number(form.tiendaId) },
      umbralMinimo: Number(form.umbralMinimo),
      cantidadReposicion: Number(form.cantidadReposicion),
      activa: form.activa,
    };

    setGuardando(true);
    try {
      const res = await fetch(editando ? `${URL_REGLAS}/${editando.id}` : URL_REGLAS, {
        method: editando ? 'PUT' : 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMensaje(
          editando ? 'Regla de reposición actualizada correctamente.' : 'Regla de reposición creada correctamente.'
        );
        cerrarModal();
        cargarReglas();
      } else {
        setErrorModal((await res.text()) || 'No se pudo guardar la regla.');
      }
    } catch {
      setErrorModal('Error de conexión con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  // ---------- ESTILOS ----------

  const claseBoton =
    'flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#254a75] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors';

  const th = 'text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3';
  const td = 'px-5 py-3.5 text-sm text-slate-700';
  const etiqueta = 'block text-sm font-medium text-slate-700 mb-1.5';
  const campo = (nombre) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
      errores[nombre] ? 'border-red-400' : 'border-slate-200'
    }`;
  const textoError = (nombre) =>
    errores[nombre] && <p className="text-xs text-red-600 mt-1.5">{errores[nombre]}</p>;

  // ---------- VISTA ----------

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* ENCABEZADO */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reglas de reposición</h1>
            <p className="text-sm text-slate-500 mt-1">
              Configura la reposición automática de inventario por producto y tienda
            </p>
          </div>
          <button className={claseBoton} onClick={() => abrirModal()}>
            + Nueva regla
          </button>
        </div>

        {mensaje && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            <span className="mr-2">✓</span>
            {mensaje}
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        {/* TABLA */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className={th}>Producto</th>
                <th className={th}>Tienda</th>
                <th className={th}>Umbral mínimo</th>
                <th className={th}>Cantidad de reposición</th>
                <th className={th}>Activa</th>
                <th className={th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reglas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-sm text-slate-400 py-10">
                    Aún no hay reglas configuradas. Usa "Nueva regla" para empezar.
                  </td>
                </tr>
              ) : (
                reglas.map((r) => (
                  // una regla inactiva se atenúa, pero su botón Editar sigue activo para poder reactivarla
                  <tr key={r.id} className={`border-b border-slate-100 ${r.activa ? '' : 'opacity-60'}`}>
                    <td className={td}>
                      <p className="font-medium text-slate-900">{r.producto.nombre}</p>
                      <p className="text-xs text-slate-400">{r.producto.identificador}</p>
                    </td>
                    <td className={td}>
                      <p>{r.tienda.nombre}</p>
                      <p className="text-xs text-slate-400">{r.tienda.region}</p>
                    </td>
                    <td className={td}>{r.umbralMinimo} unidades</td>
                    <td className={td}>{r.cantidadReposicion} unidades</td>
                    <td className={td}>
                      <span className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={r.activa}
                          readOnly
                          tabIndex={-1}
                          aria-hidden="true"
                          className="w-4 h-4 accent-[#1e3a5f] pointer-events-none"
                        />
                        {r.activa ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className={td}>
                      <button
                        onClick={() => abrirModal(r)}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                      >
                        <IconEdit className="w-4 h-4" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p className="px-5 py-3 text-xs text-slate-500">
            {reglas.length} {reglas.length === 1 ? 'regla configurada' : 'reglas configuradas'}
          </p>
        </div>
      </div>

      {/* MODAL: NUEVA REGLA / EDITAR REGLA */}
      {modal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">{editando ? 'Editar regla' : 'Nueva regla'}</h2>
              <button
                onClick={cerrarModal}
                aria-label="Cerrar"
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* noValidate: los errores por campo los muestra la pantalla, no el navegador */}
            <form onSubmit={guardar} noValidate className="px-6 py-5 space-y-4">
              {duplicada && (
                <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <p>Ya existe una regla para este producto y tienda. No se permiten reglas duplicadas.</p>
                  <button
                    type="button"
                    onClick={() => abrirModal(duplicada)}
                    className="mt-1.5 font-semibold underline hover:text-amber-900"
                  >
                    Editar regla existente
                  </button>
                </div>
              )}
              {errorModal && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                  {errorModal}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="productoId" className={etiqueta}>Producto</label>
                  <select
                    id="productoId"
                    name="productoId"
                    value={form.productoId}
                    onChange={handleChange}
                    disabled={Boolean(editando)}
                    className={campo('productoId')}
                  >
                    <option value="">Selecciona un producto</option>
                    {productos.map((p) => (
                      <option key={p.idProducto} value={p.idProducto}>
                        {p.nombre} · {p.identificador}
                      </option>
                    ))}
                  </select>
                  {textoError('productoId')}
                </div>

                <div>
                  <label htmlFor="tiendaId" className={etiqueta}>Tienda</label>
                  <select
                    id="tiendaId"
                    name="tiendaId"
                    value={form.tiendaId}
                    onChange={handleChange}
                    disabled={Boolean(editando)}
                    className={campo('tiendaId')}
                  >
                    <option value="">Selecciona una tienda</option>
                    {tiendas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} · {t.region}
                      </option>
                    ))}
                  </select>
                  {textoError('tiendaId')}
                </div>

                <div>
                  <label htmlFor="umbralMinimo" className={etiqueta}>Umbral mínimo</label>
                  <input
                    id="umbralMinimo"
                    type="number"
                    name="umbralMinimo"
                    value={form.umbralMinimo}
                    onChange={handleChange}
                    placeholder="0"
                    className={campo('umbralMinimo')}
                  />
                  {textoError('umbralMinimo')}
                </div>

                <div>
                  <label htmlFor="cantidadReposicion" className={etiqueta}>Cantidad de reposición</label>
                  <input
                    id="cantidadReposicion"
                    type="number"
                    name="cantidadReposicion"
                    value={form.cantidadReposicion}
                    onChange={handleChange}
                    placeholder="0"
                    className={campo('cantidadReposicion')}
                  />
                  {textoError('cantidadReposicion')}
                </div>
              </div>

              {editando && (
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={form.activa}
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#1e3a5f]"
                  />
                  Regla activa
                </label>
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
                  {guardando ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
