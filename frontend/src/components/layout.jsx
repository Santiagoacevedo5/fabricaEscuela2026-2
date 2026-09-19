import { useState } from 'react'

const NAV_ITEMS = [
    {
        view: 'empleados',
        label: 'Empleados',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        view: 'tiendas',
        label: 'Tiendas',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        view: 'centros',
        label: 'Centros de Distribución',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
    },
    {
        view: 'productos',
        label: 'Productos',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
]

export default function Layout({ currentView, onViewChange, onLogout, usuario, children }) {
    const [mobileOpen, setMobileOpen] = useState(false)

    const Sidebar = () => (
        <aside
            className="flex flex-col h-full"
            style={{ backgroundColor: '#1e3a5f', minWidth: 220 }}
        >
            {/* Logo */}
            <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#2563eb' }}
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <span className="text-white font-semibold text-sm tracking-tight">WebZaraV.1</span>
                </div>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                <p
                    className="px-2 pb-2 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(148,163,184,0.6)', letterSpacing: '0.1em' }}
                >
                    Sistema
                </p>
                {NAV_ITEMS.map(item => {
                    const active = currentView === item.view
                    return (
                        <button
                            key={item.view}
                            onClick={() => { onViewChange(item.view); setMobileOpen(false) }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left"
                            style={{
                                backgroundColor: active ? 'rgba(37,99,235,0.3)' : 'transparent',
                                color: active ? '#ffffff' : 'rgba(203,213,225,0.8)',
                            }}
                        >
              <span style={{ color: active ? '#60a5fa' : 'rgba(148,163,184,0.7)' }}>
                {item.icon}
              </span>
                            {item.label}
                        </button>
                    )
                })}
            </nav>

            {/* Usuario */}
            <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: '#2563eb' }}
                    >
                        {usuario.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">{usuario.nombre}</p>
                        <p className="text-xs truncate" style={{ color: 'rgba(148,163,184,0.7)' }}>
                            Administrador
                        </p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{ color: 'rgba(148,163,184,0.8)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesión
                </button>
            </div>
        </aside>
    )

    return (
        <div className="flex h-full overflow-hidden">
            {/* Barra lateral (escritorio) */}
            <div className="hidden md:flex flex-col flex-shrink-0" style={{ width: 220 }}>
                <Sidebar />
            </div>

            {/* Barra lateral (móvil) */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden flex">
                    <div
                        className="fixed inset-0"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="relative z-50 flex flex-col w-60 h-full">
                        <Sidebar />
                    </div>
                </div>
            )}

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Barra superior (móvil) */}
                <div
                    className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0"
                >
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="font-semibold text-slate-900 text-sm">
            {NAV_ITEMS.find(n => n.view === currentView)?.label}
          </span>
                </div>

                <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#f1f5f9' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}