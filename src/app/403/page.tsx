import Link from "next/link";

export default function ForbiddenPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-4">
            <h1 className="text-4xl font-bold mb-4 text-red-600">403 - Acceso Denegado</h1>
            <p className="text-lg mb-8 text-center max-w-md">
                No tienes permisos para acceder a esta página o estás intentando ingresar a un club que no te corresponde.
            </p>
            <Link href="/" className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                Volver al Inicio
            </Link>
        </div>
    );
}
