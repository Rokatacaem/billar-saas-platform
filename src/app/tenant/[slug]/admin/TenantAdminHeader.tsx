import Image from 'next/image';

export default function TenantAdminHeader({ tenant, userName }: { tenant: any, userName: string }) {
    return (
        <header className="h-20 bg-[#0a0f1c] border-b border-[#1e293b] flex items-center justify-between px-8">
            <div className="flex flex-col">
                <h1 className="text-xl font-bold text-[#38bdf8] flex items-center gap-2">
                    Panel de Control (Mesas)
                </h1>
                <span className="text-sm text-gray-400">Consola de Operaciones en Tiempo Real</span>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-sm font-bold text-white">{userName}</p>
                    <p className="text-xs text-[#22c55e] font-medium tracking-wide">Caja ABIERTA</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1e293b] border hover:border-indigo-500 border-[#334155] flex items-center justify-center text-sm font-bold text-white shadow-lg cursor-pointer transition-colors">
                    {userName.substring(0, 2).toUpperCase()}
                </div>
                <button className="px-4 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all">
                    + Nueva Mesa
                </button>
            </div>
        </header>
    );
}
