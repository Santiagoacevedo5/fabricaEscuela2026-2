import React, { useState, useEffect } from 'react';

export default function Tiendas() {
  const [tiendas, setTiendas] = useState([]);
  const [encargados, setEncargados] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    region: '',
    encargadoId: ''
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarTiendas();
    cargarEncargados();
  }, []);

  const cargarTiendas = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/tiendas');
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
      const res = await fetch('http://localhost:8080/api/tiendas/encargados-disponibles');
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
      const res = await fetch('http://localhost:8080/api/tiendas', {
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

  // Filtrado dinámico
  const tiendasFiltradas = tiendas.filter((t) => {
    const coincideTexto =
        t.nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        t.direccion?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        t.region?.toLowerCase().includes(filtroTexto.toLowerCase());

    const coincideEstado =
        filtroEstado === 'Todos' ||
        (filtroEstado === 'Activa' && t.estado !== 'Inactiva') ||
        (filtroEstado === 'Inactiva' && t.estado === 'Inactiva');

    return coincideTexto && coincideEstado;
  });

  return (
      <div style={{ backgroundColor: '#f4f6f9', fontFamily: 'Segoe UI, sans-serif', minHeight: '100%' }}>
        {/* Contenido Principal */}
        <main style={{ padding: '30px 40px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', color: '#111827' }}>Tiendas</h1>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Gestión de puntos de venta</p>
            </div>
            <button
                onClick={() => setModalAbierto(true)}
                style={{ backgroundColor: '#1e3a5f', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              + Registrar tienda
            </button>
          </div>

          {/* Buscador y Filtro */}
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
              <option value="Todos">Todos los estados</option>
              <option value="Activa">Activa</option>
              <option value="Inactiva">Inactiva</option>
            </select>
          </div>

          {/* Tabla de Tiendas */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAling: 'left' }}>
              <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left' }}>NOMBRE</th>
                <th style={{ padding: '14px 20px', textAlign: 'left' }}>DIRECCIÓN</th>
                <th style={{ padding: '14px 20px', textAlign: 'left' }}>REGIÓN</th>
                <th style={{ padding: '14px 20px', textAlign: 'left' }}>ENCARGADO</th>
                <th style={{ padding: '14px 20px', textAlign: 'left' }}>ESTADO</th>
              </tr>
              </thead>
              <tbody>
              {tiendasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '25px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
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
                          {t.encargado ? `${t.encargado.nombre}` : '—'}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                      <span
                          style={{
                            backgroundColor: t.estado === 'Inactiva' ? '#fee2e2' : '#dcfce7',
                            color: t.estado === 'Inactiva' ? '#dc2626' : '#16a34a',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                      >
                        • {t.estado || 'Activa'}
                      </span>
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

        {/* Modal Flotante de Registro */}
        {modalAbierto && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Registrar tienda</h2>
                  <button onClick={() => setModalAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Nombre de tienda *</label>
                    <input
                        type="text"
                        placeholder="Ej. Tienda Norte"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${errores.nombre ? '#ef4444' : '#d1d5db'}`, backgroundColor: errores.nombre ? '#fef2f2' : '#fff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                    />
                    {errores.nombre && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errores.nombre}</span>}
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Dirección *</label>
                    <input
                        type="text"
                        placeholder="Av. Principal #123-45"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${errores.direccion ? '#ef4444' : '#d1d5db'}`, backgroundColor: errores.direccion ? '#fef2f2' : '#fff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                    />
                    {errores.direccion && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errores.direccion}</span>}
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Región / Ciudad *</label>
                    <input
                        type="text"
                        placeholder="Bogotá"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${errores.region ? '#ef4444' : '#d1d5db'}`, backgroundColor: errores.region ? '#fef2f2' : '#fff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                    />
                    {errores.region && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errores.region}</span>}
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Encargado asignado</label>
                    <select
                        value={formData.encargadoId}
                        onChange={(e) => setFormData({ ...formData, encargadoId: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                    >
                      <option value="">Sin asignar</option>
                      {encargados.map((enc) => (
                          <option key={enc.id} value={enc.id}>{enc.nombre}</option>
                      ))}
                    </select>
                    {encargados.length === 0 && (
                        <span style={{ color: '#d97706', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                    No hay encargados de tienda disponibles.
                  </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => setModalAbierto(false)}
                        style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                        type="submit"
                        style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#1e3a5f', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                    >
                      Registrar tienda
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}