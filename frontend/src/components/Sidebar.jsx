export default function Sidebar({ activeView, onNavigate }) {
  const itemStyle = (view) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    color: activeView === view ? '#fff' : '#a0aec0',
    backgroundColor: activeView === view ? '#254a75' : 'transparent',
    borderLeft: activeView === view ? '4px solid #3b82f6' : '4px solid transparent',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: activeView === view ? '600' : '400',
    cursor: 'pointer'
  });

  const navigate = (event, view) => {
    event.preventDefault();
    onNavigate(view);
  };

  return (
    <aside style={{ width: '240px', flexShrink: 0, backgroundColor: '#1a3352', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 0', minHeight: '100vh' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 20px 30px 20px', fontSize: '18px', fontWeight: 'bold' }}>
          <div style={{ width: '28px', height: '28px', backgroundColor: '#2563eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
          WebZaraV.1
        </div>

        <div style={{ fontSize: '11px', color: '#8fa0b5', padding: '0 20px 10px 20px', fontWeight: 'bold', letterSpacing: '1px' }}>SISTEMA</div>
        <nav>
          <a href="#empleados" style={itemStyle('empleados')}>👥 Empleados</a>
          <a href="#tiendas" onClick={(event) => navigate(event, 'tiendas')} style={itemStyle('tiendas')}>🏪 Tiendas</a>
          <a href="#centros" style={itemStyle('centros')}>🔄 Centros de Distribución</a>
          <a href="#productos" onClick={(event) => navigate(event, 'productos')} style={itemStyle('productos')}>📦 Productos</a>
        </nav>
      </div>

      <div style={{ padding: '0 20px', borderTop: '1px solid #284466', paddingTop: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>A</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Administrador del Siste...</div>
            <div style={{ fontSize: '11px', color: '#8fa0b5' }}>Administrador</div>
          </div>
        </div>
        <div style={{ fontSize: '13px', color: '#a0aec0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ↪ Cerrar sesión
        </div>
      </div>
    </aside>
  );
}
