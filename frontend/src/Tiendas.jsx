import React, { useState, useEffect } from 'react';
import Modal from './components/Modal';
import InventarioTienda from './pages/InventarioTienda';

// /api/tiendas devuelve el encargado como UserInfo (campo "name"); /encargados-disponibles devuelve "nombre"
const nombreDe = (e) => e.nombre ?? e.name;

export default function Tiendas() {
  const [tiendaInventario, setTiendaInventario] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [encargados, setEncargados] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [mensajeExito, setMensajeExito] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    region: '',
    encargadoId: ''
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

  const validarFormulario = () => {
    let errs = {};
    if (!formData.nombre.trim()) errs.nombre = 'Campo obligatorio';
    if (!formData.direccion.trim()) errs.direccion = 'Campo obligatorio';
    if (!formData.region.trim()) errs.region = 'Campo obligatorio';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tiendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setModalAbierto(false);
        setFormData({ nombre: '', direccion: '', region: '', encargadoId: '' });
        setErrores({});
        cargarTiendas();
        cargarEncargados();
      }
    } catch (e) {
      console.error('Error al registrar tienda:', e);
    }
  };

  const abrirModalEditar = (tienda) => {
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

    // HU3.5: confirmación antes de cambiar el estado
    const original = tiendas.find((t) => t.id === editFormData.id);
    if ((original?.activa !== false) !== editFormData.activa &&
        !window.confirm(`¿Seguro que deseas ${editFormData.activa ? 'activar' : 'desactivar'} esta tienda?`)) return;

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
    <div style={{ backgroundColor: '#f4f6f9', fontFamily: 'Segoe UI, sans-serif', minHeight: '100%' }}>
      <main style={{ padding: '30px 40px' }}>

        {mensajeExito && (
          <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
            ✓ {mensajeExito}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', color: '#111827' }}>Tiendas</h1>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Gestión de puntos de venta</p>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            style={{ backgroundColor: '#1e3a5f', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            + Registrar tienda
          </button>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Buscar por nombre, región o dirección..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            style={{ flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none', backgroundColor: '#fff', fontSize: '14px' }}
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ width: '180px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', fontSize: '14px', outline: 'none' }}
          >
            <option value="Todos">Todos</option>
            <option value="Activa">Activa</option>
            <option value="Inactiva">Inactiva</option>
          </select>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px' }}>NOMBRE</th>
                <th style={{ padding: '14px 20px' }}>DIRECCIÓN</th>
                <th style={{ padding: '14px 20px' }}>REGIÓN</th>
                <th style={{ padding: '14px 20px' }}>ENCARGADO</th>
                <th style={{ padding: '14px 20px' }}>ESTADO</th>
                <th style={{ padding: '14px 20px' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {tiendasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '25px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                    No hay tiendas registradas.
                  </td>
                </tr>
              ) : (
                tiendasFiltradas.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '600' }}>{t.nombre}</td>
                    <td style={{ padding: '16px 20px', color: '#4b5563' }}>{t.direccion}</td>
                    <td style={{ padding: '16px 20px', color: '#4b5563' }}>{t.region}</td>
                    <td style={{ padding: '16px 20px', color: '#4b5563' }}>
                      {t.encargado ? nombreDe(t.encargado) : '—'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          backgroundColor: t.activa === false ? '#fee2e2' : '#dcfce7',
                          color: t.activa === false ? '#dc2626' : '#16a34a',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        • {t.activa === false ? 'Inactiva' : 'Activa'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setTiendaInventario(t)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#374151', fontSize: '13px', cursor: 'pointer' }}>
                          Ver inventario
                        </button>
                        <button onClick={() => abrirModalEditar(t)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#374151', fontSize: '13px', cursor: 'pointer' }}>
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ padding: '15px 20px', fontSize: '12px', color: '#9ca3af', borderTop: '1px solid #e5e7eb' }}>
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
        <Modal title="Editar tienda" onClose={() => setModalEditarAbierto(false)}>
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
                  // el encargado actual no viene en "disponibles" porque ya está asignado a esta tienda
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
        </Modal>
      )}
    </div>
  );
}
