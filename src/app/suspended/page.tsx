export default function SuspendedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Servicio Suspendido</h1>
                <p className="text-gray-600 mb-6">
                    El acceso a este club ha sido suspendido temporalmente por razones administrativas o falta de pago.
                </p>
                <div className="bg-gray-50 rounded p-4 mb-6">
                    <p className="text-sm text-gray-500">
                        Si eres el administrador, por favor contacta a soporte para regularizar la situación.
                    </p>
                </div>
                <a
                    href="mailto:soporte@tudominio.com"
                    className="inline-flex justify-center w-full px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                >
                    Contactar Soporte
                </a>
            </div>
        </div>
    );
}
