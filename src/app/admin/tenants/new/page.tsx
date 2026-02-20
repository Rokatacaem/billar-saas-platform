import TenantStepper from "./TenantStepper";

export default function NewTenantPage() {
    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                    Provisionar Nuevo Cliente
                </h1>
                <p className="mt-3 text-xl text-gray-500 dark:text-gray-400">
                    Sigue los pasos para configurar la identidad, el modelo y el acceso del nuevo tenant.
                </p>
            </header>

            <TenantStepper />
        </div>
    );
}
