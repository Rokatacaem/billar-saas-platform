'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TenantAdminSidebar({ tenant, slug }: { tenant: any, slug: string }) {
    const pathname = usePathname();

    const navItems = [
        { label: 'Inicio', href: `/tenant/${slug}/admin/dashboard-club`, icon: '🏠' },
        { label: 'Mesas (Cockpit)', href: `/tenant/${slug}/admin/cockpit`, icon: '🎮', isActive: pathname.includes('/cockpit') },
        { label: 'Socios', href: `/tenant/${slug}/admin/members`, icon: '👥', isActive: pathname.includes('/members') },
        { label: 'Productos', href: `/tenant/${slug}/admin/inventory`, icon: '📦', isActive: pathname.includes('/inventory') },
        { label: 'Caja y Turnos', href: `/tenant/${slug}/admin/z-report`, icon: '⚖️', isActive: pathname.includes('/z-report') },
        { label: 'Lista de Espera', href: `/tenant/${slug}/admin/waitlist`, icon: '📋', isActive: pathname.includes('/waitlist') },
        { label: 'Publicidad', href: `/tenant/${slug}/admin/marketing`, icon: '📺', isActive: pathname.includes('/marketing') },
        { label: 'Enlaces Kiosco', href: `/tenant/${slug}/admin/kiosk`, icon: '🔗', isActive: pathname.includes('/kiosk') },
        { label: 'Usuarios', href: `/tenant/${slug}/admin/settings/users`, icon: '👤', isActive: pathname.includes('/users') },
    ];

    return (
        <aside className="w-64 bg-[#0a0f1c] text-gray-300 min-h-screen flex flex-col border-r border-[#1e293b]">
            <div className="p-6 flex flex-col items-center border-b border-[#1e293b]">
                {tenant.logoUrl ? (
                    <img src={tenant.logoUrl} alt="Logo" className="w-20 h-20 rounded-full mb-4 shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                ) : (
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4"
                        style={{ backgroundColor: tenant.primaryColor, color: '#fff' }}
                    >
                        {tenant.name.charAt(0)}
                    </div>
                )}
                <h2 className="text-xl font-bold text-white tracking-wide text-center">{tenant.name}</h2>
                <p className="text-xs text-indigo-400 mt-1 uppercase tracking-widest">Gestión del Sistema</p>
            </div>

            <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
                {navItems.map((item) => {
                    const active = item.isActive !== undefined ? item.isActive : pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-6 py-3 transition-colors ${active
                                    ? 'bg-[#1e293b] text-white border-l-4 border-indigo-500'
                                    : 'text-gray-400 hover:bg-[#111827] hover:text-white border-l-4 border-transparent'
                                }`}
                        >
                            <span className="text-lg opacity-80">{item.icon}</span>
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-[#1e293b] flex flex-col gap-3">
                <button className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                    <span>🔒</span> Cambiar Contraseña
                </button>
                <button className="flex items-center gap-3 text-sm text-red-400 hover:text-red-300 transition-colors" onClick={() => {
                    window.location.href = '/api/auth/signout?callbackUrl=/login';
                }}>
                    <span>🚪</span> Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}
