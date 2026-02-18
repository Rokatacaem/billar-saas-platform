
import Link from 'next/link';

export default function RenewalPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mx-auto h-12 w-12 text-center text-4xl">🔄</div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Renovación de Servicio
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Reactiva tu plataforma y sigue operando sin interrupciones.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">

                    <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                ℹ️
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    Si tu servicio ha sido suspendido o está por vencer, contáctanos inmediatamente para regularizar tu cuenta.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Canales de Pago</h3>
                            <p className="mt-1 text-sm text-gray-500">Aceptamos transferencias y tarjetas de crédito.</p>

                            <ul className="mt-4 space-y-3">
                                <li className="flex items-center p-3 bg-gray-50 rounded-md">
                                    <span className="text-xl mr-3">🏦</span>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">Transferencia Bancaria</div>
                                        <div className="text-xs text-gray-500">Banco Santander / 00123456789</div>
                                    </div>
                                </li>
                                <li className="flex items-center p-3 bg-gray-50 rounded-md">
                                    <span className="text-xl mr-3">💳</span>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">Pago en Línea</div>
                                        <div className="text-xs text-gray-500">Link de pago personalizado</div>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Contacto Directo</h3>
                            <a
                                href="https://wa.me/1234567890" // Reemplazar con número real
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Hablar por WhatsApp
                            </a>
                            <a
                                href="mailto:soporte@billarplatform.com"
                                className="mt-3 w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Enviar Correo
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                        &larr; Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
