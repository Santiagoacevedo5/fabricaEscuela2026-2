import { useState } from 'react'
import { ROL_FULL_LABELS } from '../roles'

// HUS-02: cada opción del menú indica qué roles la ven.
// Esto solo ordena la pantalla; la protección real está en el backend (SecurityConfig).
const TODOS = ['ROLE_ADMIN', 'ENCARGADO_CD', 'ENCARGADO_TIENDA']

const NAV_ITEMS = [
    {
        view: 'empleados',
        label: 'Empleados',
        roles: ['ROLE_ADMIN'],
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        view: 'tiendas',
        label: 'Tiendas',
        roles: TODOS,
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        view: 'centros',
        label: 'Centros de Distribución',
        roles: TODOS,
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
    },
    {
        view: 'productos',
        label: 'Productos',
        roles: TODOS,
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
    {
        view: 'inventario',
        label: 'Inventario',
        roles: TODOS,
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
    },
    {
        view: 'ventas',
        label: 'Ventas',
        roles: ['ROLE_ADMIN', 'ENCARGADO_TIENDA'],
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l2.4 12.2a2 2 0 002 1.6h8.8a2 2 0 002-1.6L22 8H6m4 13a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
        ),
    },
]

export default function Layout({ currentView, onViewChange, onLogout, usuario, children }) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [sidebarColapsado, setSidebarColapsado] = useState(false)
    // Solo las opciones permitidas para alguno de los roles del usuario
    const navItems = NAV_ITEMS.filter(item =>
        usuario?.roles?.some(rol => item.roles.includes(rol))
    )

    const renderSidebar = (compacto = false, mostrarControl = true) => (
        <aside
            className="flex flex-col h-full"
            style={{ backgroundColor: '#1e3a5f', width: compacto ? 72 : 220 }}
        >
            {/* Logo */}
            <div className={`flex items-center ${compacto ? 'flex-col gap-3 px-2' : 'justify-between px-5'} py-5`} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div className={`flex items-center ${compacto ? '' : 'gap-2.5'}`}>
                    <div
                        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#2563eb' }}
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    {!compacto && <span className="text-white font-semibold text-sm tracking-tight">WebZaraV.1</span>}
                </div>
                {mostrarControl && (
                    <button
                        type="button"
                        onClick={() => setSidebarColapsado(value => !value)}
                        aria-label={compacto ? 'Expandir menú lateral' : 'Contraer menú lateral'}
                        aria-expanded={!compacto}
                        title={compacto ? 'Expandir menú' : 'Contraer menú'}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <svg className={`h-4 w-4 transition-transform ${compacto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Navegación */}
            <nav aria-label="Navegación principal" className={`flex-1 py-4 ${compacto ? 'px-2' : 'px-3'} space-y-0.5 overflow-y-auto`}>
                {!compacto && (
                    <p
                        className="px-2 pb-2 text-xs font-semibold uppercase tracking-widest"
                        style={{ color: 'rgba(148,163,184,0.6)', letterSpacing: '0.1em' }}
                    >
                        Sistema
                    </p>
                )}
                {navItems.map(item => {
                    const active = currentView === item.view
                    return (
                        <button
                            key={item.view}
                            onClick={() => { onViewChange(item.view); setMobileOpen(false) }}
                            aria-label={item.label}
                            aria-current={active ? 'page' : undefined}
                            title={compacto ? item.label : undefined}
                            className={`flex w-full items-center rounded-lg py-2 text-sm font-medium transition-all ${
                                compacto ? 'justify-center px-0' : 'gap-2.5 px-3 text-left'
                            }`}
                            style={{
                                backgroundColor: active ? 'rgba(37,99,235,0.3)' : 'transparent',
                                color: active ? '#ffffff' : 'rgba(203,213,225,0.8)',
                            }}
                        >
                            <span className="flex shrink-0" style={{ color: active ? '#60a5fa' : 'rgba(148,163,184,0.7)' }}>
                                {item.icon}
                            </span>
                            {!compacto && item.label}
                        </button>
                    )
                })}
            </nav>

            {/* Usuario */}
            <div className={`${compacto ? 'px-2' : 'px-4'} py-4`} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className={`mb-3 flex items-center ${compacto ? 'justify-center' : 'gap-3'}`}>
                    <div
                        title={compacto ? usuario.nombre : undefined}
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: '#2563eb' }}
                    >
                        {usuario.nombre.charAt(0).toUpperCase()}
                    </div>
                    {!compacto && <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">{usuario.nombre}</p>
                        <p className="text-xs truncate" style={{ color: 'rgba(148,163,184,0.7)' }}>
                            {usuario.roles?.length
                                ? usuario.roles.map(rol => ROL_FULL_LABELS[rol] || rol).join(', ')
                                : 'Sin rol asignado'}
                        </p>
                    </div>}
                </div>
                <button
                    onClick={onLogout}
                    aria-label="Cerrar sesión"
                    title={compacto ? 'Cerrar sesión' : undefined}
                    className={`flex w-full items-center rounded-lg py-2 text-xs transition-colors ${
                        compacto ? 'justify-center px-0' : 'gap-2 px-3'
                    }`}
                    style={{ color: 'rgba(148,163,184,0.8)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!compacto && 'Cerrar sesión'}
                </button>
            </div>
        </aside>
    )

    return (
        <div className="flex h-full overflow-hidden">
            {/* Barra lateral (escritorio) */}
            <div
                className="hidden md:flex flex-col flex-shrink-0 transition-[width] duration-200"
                style={{ width: sidebarColapsado ? 72 : 220 }}
            >
                {renderSidebar(sidebarColapsado)}
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
                        {renderSidebar(false, false)}
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
            {navItems.find(n => n.view === currentView)?.label}
          </span>
                </div>

                <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#f1f5f9' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}