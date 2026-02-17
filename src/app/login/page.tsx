import { signIn } from "@/auth";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
                <h1 className="text-2xl font-bold text-center">Iniciar Sesión (Dev)</h1>

                <form
                    action={async (formData) => {
                        "use server";
                        try {
                            const email = formData.get("email");
                            console.log("Login attempt for:", email);
                            await signIn("credentials", {
                                email,
                                redirectTo: "/",
                            });
                        } catch (error) {
                            if ((error as Error).message.includes("NEXT_REDIRECT")) {
                                throw error;
                            }
                            console.error("Login error:", error);
                            // In a real app we'd return a state to show error
                            // For now, redirect to login with error
                            // redirect("/login?error=CredentialsSignin"); // Can't redirect inside try/catch easily without dancing around Next.js quirks
                            throw error;
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
                    </div>
                </form>
            </div>
        </div>
    );
}
