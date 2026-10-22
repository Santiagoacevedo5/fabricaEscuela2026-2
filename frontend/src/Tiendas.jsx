import React, { useState, useEffect } from 'react';
import Modal from './components/Modal';
import InventarioTienda from './pages/InventarioTienda';

// /api/tiendas devuelve el encargado como UserInfo (campo "name"); /encargados-disponibles devuelve "nombre"
const nombreDe = (e) => e.nombre ?? e.name;

export default function Tiendas() {
  const [tiendaInventario, setTiendaInventario] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [encargados, setEncargados] = useState([]);
  const [centros, setCentros] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [confirmacionEstado, setConfirmacionEstado] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [mensajeExito, setMensajeExito] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    region: '',
    encargadoId: '',
    centroId: ''
  });

  const [editFormData, setEditFormData] = useState({
    id: null,
    nombre: '',
    direccion: '',
    region: '',
    encargadoId: '',
    activa: true
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarTiendas();
    cargarEncargados();
    cargarCentros();
  }, []);

  const cargarTiendas = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tiendas`);
      if (res.ok) {
        const data = await res.json();
        setTiendas(data);
      }
    } catch (e) {
      console.error('Error al cargar tiendas:', e);
    }
  };

  const cargarEncargados = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tiendas/encargados-disponibles`);
      if (res.ok) {
        const data = await res.json();
        setEncargados(data);
      }
    } catch (e) {
      console.error('Error al cargar encargados:', e);
    }
  };

  // CD disponibles para asignar a la tienda (toda tienda debe pertenecer a un CD)
  const cargarCentros = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/centros`);
      if (res.ok) {
        const data = await res.json();
        setCentros(data);
      }
    } catch (e) {
      console.error('Error al cargar centros de distribución:', e);
    }
  };

  const validarFormulario = () => {
    let errs = {};
    if (!formData.nombre.trim()) errs.nombre = 'Campo obligatorio';
    if (!formData.direccion.trim()) errs.direccion = 'Campo obligatorio';
    if (!formData.region.trim()) errs.region = 'Campo obligatorio';
    if (!formData.centroId) errs.centroId = 'Campo obligatorio';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      const bodyPayload = {
        nombre: formData.nombre,
        direccion: formData.direccion,
        region: formData.region,
        encargado: formData.encargadoId ? { id: Number(formData.encargadoId) } : null,
        centroDistribucion: { id: Number(formData.centroId) }
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tiendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        setModalAbierto(false);
        setFormData({ nombre: '', direccion: '', region: '', encargadoId: '', centroId: '' });
        setErrores({});
        cargarTiendas();
        cargarEncargados();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'No se pudo registrar la tienda.');
      }
    } catch (e) {
      console.error('Error al registrar tienda:', e);
    }
  };

  const abrirModalEditar = (tienda) => {
    setConfirmacionEstado(false);
    setEditFormData({
      id: tienda.id,
      nombre: tienda.nombre || '',
      direccion: tienda.direccion || '',
      region: tienda.region || '',
      encargadoId: tienda.encargado ? tienda.encargado.id : '',
      activa: tienda.activa !== undefined ? tienda.activa : true
    });
    setModalEditarAbierto(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const original = tiendas.find((t) => t.id === editFormData.id);
    if ((original?.activa !== false) !== editFormData.activa) {
      setConfirmacionEstado(true);
      return;
    }

    await actualizarTienda();
  };

  const actualizarTienda = async () => {
    try {
      const bodyPayload = {
        direccion: editFormData.direccion,
        region: editFormData.region,
        activa: editFormData.activa,
        encargado: editFormData.encargadoId ? { id: Number(editFormData.encargadoId) } : null
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tiendas/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        setModalEditarAbierto(false);
        setConfirmacionEstado(false);
        setMensajeExito('Tienda actualizada exitosamente.');
        cargarTiendas();
        cargarEncargados();
        setTimeout(() => setMensajeExito(''), 4000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Error al actualizar la tienda');
      }
    } catch (e) {
      console.error('Error al editar tienda:', e);
    }
  };

  const tiendasFiltradas = tiendas.filter((t) => {
    const coincideTexto =
        t.nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        t.direccion?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        t.region?.toLowerCase().includes(filtroTexto.toLowerCase());

    const coincideEstado =
        filtroEstado === 'Todos' ||
        (filtroEstado === 'Activa' && t.activa !== false) ||
        (filtroEstado === 'Inactiva' && t.activa === false);

    return coincideTexto && coincideEstado;
  });

  if (tiendaInventario) {
    return <InventarioTienda tienda={tiendaInventario} onVolver={() => setTiendaInventario(null)} />;
  }

  return (
      <div className="min-h-full bg-slate-100">
        <main className="mx-auto w-full max-w-7xl p-6">

          {mensajeExito && (
              <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                ✓ {mensajeExito}
              </div>
          )}

          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Tiendas</h1>
              <p className="mt-0.5 text-sm text-slate-500">Gestión de puntos de venta</p>
            </div>
            <button
                onClick={() => setModalAbierto(true)}
                className="data-table-primary-button"
            >
              + Registrar tienda
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <input
                type="text"
                placeholder="Buscar por nombre, región o dirección..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="min-w-48 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos</option>
              <option value="Activa">Activa</option>
              <option value="Inactiva">Inactiva</option>
            </select>
          </div>

          <div className="data-table-card">
            <div className="data-table-scroll">
              <table className="data-table">
                <thead>
                <tr>
                  <th>NOMBRE</th>
                  <th>DIRECCIÓN</th>
                  <th>REGIÓN</th>
                  <th>CD</th>
                  <th>ENCARGADO</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
                </thead>
                <tbody>
                {tiendasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        No hay tiendas registradas.
                      </td>
                    </tr>
                ) : (
                    tiendasFiltradas.map((t) => (
                        <tr key={t.id}>
                          <td className="font-medium text-slate-900">{t.nombre}</td>
                          <td>{t.direccion}</td>
                          <td>{t.region}</td>
                          <td>{t.centroDistribucion?.nombre ?? '—'}</td>
                          <td>
                            {t.encargado ? nombreDe(t.encargado) : '—'}
                          </td>
                          <td>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.activa === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                            t.activa === false ? 'bg-red-500' : 'bg-green-500'
                        }`} />
                        {t.activa === false ? 'Inactiva' : 'Activa'}
                      </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                  type="button"
                                  onClick={() => setTiendaInventario(t)}
                                  aria-label={`Ver inventario de ${t.nombre}`}
                                  title="Ver inventario"
                                  className="data-table-action"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 12s3.5-7 9.75-7 9.75 7 9.75 7-3.5 7-9.75 7-9.75-7-9.75-7Z" />
                                  <circle cx="12" cy="12" r="3" strokeWidth={2} />
                                </svg>
                              </button>
                              <button
                                  type="button"
                                  onClick={() => abrirModalEditar(t)}
                                  aria-label={`Editar ${t.nombre}`}
                                  title="Editar"
                                  className="data-table-action"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16.862 4.487 2.651 2.651M7 17l4-1 9.513-9.513a1.875 1.875 0 0 0-2.652-2.652L8.348 13.348 7 17Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))
                )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
              {tiendasFiltradas.length} de {tiendas.length} tiendas
            </div>
          </div>
        </main>

        {/* Modal Registrar Tienda reutilizando <Modal /> */}
        {modalAbierto && (
            <Modal title="Registrar tienda" onClose={() => setModalAbierto(false)}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Nombre de tienda *</label>
                  <input
                      type="text"
                      placeholder="Ej. Tienda Norte"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${errores.nombre ? '#ef4444' : '#d1d5db'}`, fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Dirección *</label>
                  <input
                      type="text"
                      placeholder="Av. Principal #123-45"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${errores.direccion ? '#ef4444' : '#d1d5db'}`, fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Región / Ciudad *</label>
                  <input
                      type="text"
                      placeholder="Bogotá"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${errores.region ? '#ef4444' : '#d1d5db'}`, fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Centro de distribución *</label>
                  <select
                      value={formData.centroId}
                      onChange={(e) => setFormData({ ...formData, centroId: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${errores.centroId ? '#ef4444' : '#d1d5db'}`, backgroundColor: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="">Seleccione el CD que abastece la tienda</option>
                    {centros.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  {errores.centroId && (
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ef4444' }}>{errores.centroId}</p>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Encargado asignado</label>
                  <select
                      value={formData.encargadoId}
                      onChange={(e) => setFormData({ ...formData, encargadoId: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="">Sin asignar</option>
                    {encargados.map((enc) => (
                        <option key={enc.id} value={enc.id}>{enc.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setModalAbierto(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#1e3a5f', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                    Registrar tienda
                  </button>
                </div>
              </form>
            </Modal>
        )}

        {/* Modal Editar Tienda reutilizando <Modal /> (HU3.5) */}
        {modalEditarAbierto && (
            <Modal
                title={confirmacionEstado ? 'Confirmar cambio de estado' : 'Editar tienda'}
                onClose={() => {
                  setConfirmacionEstado(false);
                  setModalEditarAbierto(false);
                }}
            >
              {confirmacionEstado ? (
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                      ¿Seguro que deseas {editFormData.activa ? 'activar' : 'desactivar'} esta tienda?
                    </p>
                    <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280' }}>
                      {editFormData.nombre}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                          type="button"
                          onClick={() => setConfirmacionEstado(false)}
                          style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                      >
                        Volver
                      </button>
                      <button
                          type="button"
                          onClick={actualizarTienda}
                          style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: editFormData.activa ? '#15803d' : '#dc2626', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                      >
                        Sí, {editFormData.activa ? 'activar' : 'desactivar'}
                      </button>
                    </div>
                  </div>
              ) : (
                  <form onSubmit={handleEditSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Nombre de tienda *</label>
                      <input
                          type="text"
                          value={editFormData.nombre}
                          disabled
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Dirección *</label>
                      <input
                          type="text"
                          value={editFormData.direccion}
                          onChange={(e) => setEditFormData({ ...editFormData, direccion: e.target.value })}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                          required
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Región / Ciudad *</label>
                      <input
                          type="text"
                          value={editFormData.region}
                          onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                          required
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Encargado asignado</label>
                      <select
                          value={editFormData.encargadoId}
                          onChange={(e) => setEditFormData({ ...editFormData, encargadoId: e.target.value })}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                      >
                        <option value="">Sin asignar</option>
                        {(() => {
                          const actual = tiendas.find((t) => t.id === editFormData.id)?.encargado;
                          const opciones = actual ? [actual, ...encargados.filter((e) => e.id !== actual.id)] : encargados;
                          return opciones.map((enc) => (
                              <option key={enc.id} value={enc.id}>{nombreDe(enc)}</option>
                          ));
                        })()}
                      </select>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151', cursor: 'pointer', marginBottom: '24px' }}>
                      <input
                          type="checkbox"
                          checked={editFormData.activa}
                          onChange={(e) => setEditFormData({ ...editFormData, activa: e.target.checked })}
                      />
                      Activar/desactivar
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button type="button" onClick={() => setModalEditarAbierto(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                      <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#1e3a5f', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                        Confirmar
                      </button>
                    </div>
                  </form>
              )}
            </Modal>
        )}
      </div>
  );
}