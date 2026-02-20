'use client';

import { authenticate } from "@/app/actions/auth-actions";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
    tenantName?: string;
    logoUrl?: string;
    primaryColor?: string;
}

export default function LoginForm({ tenantName, logoUrl, primaryColor }: LoginFormProps) {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
    const [showPassword, setShowPassword] = useState(false);

    // Determines dynamic styles based on White-Labeling (subdomain) or standard fallback
    const isWhiteLabel = !!tenantName;
    const buttonStyle = isWhiteLabel ? { backgroundColor: primaryColor || '#0ea5e9' } : {};

    return (
        <div className={`w-full max-w-md p-8 bg-white border ${isWhiteLabel ? 'shadow-2xl rounded-2xl border-gray-100' : 'shadow-md rounded border-gray-200'} space-y-6`}>

            <div className="text-center space-y-2 mb-6">
                {logoUrl ? (
                    <img src={logoUrl} alt={tenantName || 'Logo'} className="h-20 mx-auto object-contain" />
                ) : (
                    <h1 className="text-2xl font-black text-slate-900">
                        {isWhiteLabel ? `Ingreso ${tenantName}` : 'Iniciar Sesión (Dev)'}
                    </h1>
                )}
                {isWhiteLabel && (
                    <p className="text-sm text-gray-500">Accede a tu cuenta de socio o administrador</p>
                )}
            </div>

            <form action={formAction} className="space-y-4">
                {errorMessage && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
                        {errorMessage}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        name="email"
                        type="email"
                        className="w-full p-2 mt-1 border border-gray-300 rounded focus:ring-2 focus:ring-offset-1 focus:outline-none text-gray-900"
                        style={{ '--tw-ring-color': isWhiteLabel ? primaryColor : '#3b82f6' } as React.CSSProperties}
                        placeholder={isWhiteLabel ? "tu@correo.com" : "rodrigo@akapoolco.cl"}
                        required
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="relative mt-1">
                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-offset-1 focus:outline-none text-gray-900 pr-10"
                            style={{ '--tw-ring-color': isWhiteLabel ? primaryColor : '#3b82f6' } as React.CSSProperties}
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className={`w-full py-3 text-white rounded-lg font-bold transition-transform active:scale-95 disabled:opacity-50 ${!isWhiteLabel && 'bg-blue-600 hover:bg-blue-700'}`}
                    style={buttonStyle}
                >
                    {isPending ? 'Ingresando...' : 'Entrar al Sistema'}
                </button>

                {!isWhiteLabel && (
                    <div className="text-xs text-gray-500 mt-4 border-t pt-4">
                        <p>Usuarios disponibles:</p>
                        <ul className="list-disc pl-5 mt-1">
                            <li>rodrigo@akapoolco.cl (Akapoolco)</li>
                            <li>admin@santiago.cl (Santiago)</li>
                        </ul>
                        <p className="mt-2 text-red-500 font-bold">Nota: Password es 'password123'</p>
                    </div>
                )}
            </form>

            {isWhiteLabel && (
                <div className="text-center mt-6">
                    <p className="text-xs text-gray-400">Powered by <strong>WOR Billiard Systems</strong></p>
                </div>
            )}
        </div>
    );
}
