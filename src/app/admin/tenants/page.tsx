import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteTenantButton from "./DeleteTenantButton";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const tenants = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { tables: true, users: true }
            }
        }
    });
    // 3. Mock DB Metrics (In real scenario, use pg_stat_activity query)
    // Removed unstable Math.random during render

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Gestión de Tenants
                    </h2>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <Link
                        href="/admin/tenants/new"
                        className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        + Nuevo Club
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Nombre</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Slug (Subdominio)</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Región</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Tipo</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Estadísticas</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Fecha Alta</th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {tenants.map((tenant) => (
                            <tr key={tenant.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                            style={{ backgroundColor: tenant.primaryColor }}
                                        >
                                            {tenant.name.charAt(0)}
                                        </div>
                                        {tenant.name}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    {(() => {
                                        // Usa NEXT_PUBLIC_ROOT_DOMAIN si existe.
                                        // Si no existe, pero estamos en Vercel, armamos el subdominio sobre el dominio por defecto de Vercel.
                                        let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
                                        if (!rootDomain) {
                                            rootDomain = process.env.NEXT_PUBLIC_VERCEL_URL ? 'billar-saas-platform.vercel.app' : 'localhost:3000';
                                        }

                                        // Determine protocol based on environment
                                        const protocol = rootDomain.includes('localhost') ? 'http' : 'https';
                                        const tenantUrl = `${protocol}://${tenant.slug}.${rootDomain}`;

                                        return (
                                            <a href={tenantUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:underline">
                                                {tenant.slug}.{rootDomain}
                                            </a>
                                        );
                                    })()}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900 dark:text-white">{tenant.currencyCode}</span>
                                        <span className="text-xs text-gray-500">{tenant.timezone}</span>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${tenant.type === 'CLUB' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'}`}>
                                        {tenant.type}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    {tenant._count.tables} mesas · {tenant._count.users} usuarios
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    {new Date(tenant.createdAt).toLocaleDateString()}
                                </td>
                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link href={`/admin/tenants/${tenant.id}`} className="text-indigo-600 hover:text-indigo-900">Editar</Link>
                                        <span className="text-gray-300">|</span>
                                        <DeleteTenantButton tenantId={tenant.id} tenantName={tenant.name} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
