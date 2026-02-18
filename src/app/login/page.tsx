import { authenticate } from "@/app/actions/auth-actions";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
                <h1 className="text-2xl font-bold text-center">Iniciar Sesión (Dev)</h1>

                <form
                    action={async (formData) => {
                        "use server";
                        const result = await authenticate(undefined, formData);
                        if (result) {
                            console.error("Login failed:", result);
                            // In a real app, use useFormState to show this error
                        }
                    }}
                    className="space-y-4"
                >
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
                        <input
                            name="password"
                            type="password"
                            className="w-full p-2 mt-1 border rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="password123"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Ingresar
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
