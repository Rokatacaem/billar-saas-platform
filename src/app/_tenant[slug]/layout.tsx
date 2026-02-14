import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import React from "react";

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { slug: string };
}) {
    // 1. Buscamos los datos del club/negocio por su slug
    const tenant = await prisma.tenant.findUnique({
        where: { slug: params.slug },
    });

    // 2. Si el club no existe, devolvemos un 404
    if (!tenant) {
        notFound();
    }

    return (
        <div className="min-h-screen font-sans antialiased">
            {/* 3. Inyectamos los colores del club en variables CSS de Tailwind 4 */}
            <style>{`
        :root {
          --color-primary: ${tenant.primaryColor};
          --color-secondary: ${tenant.secondaryColor};
        }
      `}</style>

            <header className="border-b bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {tenant.logoUrl && (
                            <img src={tenant.logoUrl} alt={tenant.name} className="h-10 w-auto" />
                        )}
                        <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                            {tenant.name}
                        </h1>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase text-slate-600">
                        Modo {tenant.type}
                    </span>
                </div>
            </header>

            <main className="p-6">
                {children}
            </main>
        </div>
    );
}