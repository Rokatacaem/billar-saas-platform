'use client';

import { authenticate } from "@/app/actions/auth-actions";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md border border-gray-200">
                <h1 className="text-2xl font-bold text-center text-slate-900">Iniciar Sesión (Dev)</h1>

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
                            className="w-full p-2 mt-1 border rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="rodrigo@akapoolco.cl"
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
                                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 pr-10"
                                placeholder="password123"
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
                        className="w-full py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isPending ? 'Ingresando...' : 'Ingresar'}
                    </button>
                    <div className="text-xs text-gray-500 mt-4">
                        <p>Usuarios disponibles:</p>
                        <ul className="list-disc pl-5">
                            <li>rodrigo@akapoolco.cl (Akapoolco)</li>
                            <li>admin@santiago.cl (Santiago)</li>
                        </ul>
                        <p className="mt-2 text-red-500 font-bold">Nota: Password es &apos;password123&apos;</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
