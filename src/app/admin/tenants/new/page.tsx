import { createTenantWithAssets } from "@/app/actions/admin-actions";

export default function NewTenantPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Registrar Nuevo Club / Negocio
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Configura la infraestructura y cuenta administrativa para un nuevo cliente.
                    </p>
                </div>
            </div>

            <form action={createTenantWithAssets} className="bg-white dark:bg-gray-800 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    {/* Section: Business Details */}
                    <div className="space-y-6">
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Detalles del Negocio</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Información pública del establecimiento.</p>
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Nombre del Local</label>
                            <div className="mt-2">
                                <input type="text" name="name" id="name" required className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" placeholder="Ej: Billar Club Central" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="slug" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Slug (Subdominio)</label>
                            <div className="mt-2 flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 bg-gray-50 dark:bg-gray-700">
                                <input type="text" name="slug" id="slug" required className="block flex-1 border-0 bg-transparent py-1.5 pl-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6" placeholder="mi-club" />
                                <span className="flex select-none items-center pr-3 text-gray-500 dark:text-gray-400 sm:text-sm">.localhost:3000</span>
                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">País / Región</label>
                                    <div className="mt-2">
                                        <select id="country" name="country" className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3">
                                            <option value="CL">Chile (CLP - IVA 19%)</option>
                                            <option value="PE">Perú (PEN - IGV 18%)</option>
                                            <option value="MX">México (MXN - IVA 16%)</option>
                                            <option value="ES">España (EUR - IVA 21%)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Tipo de Negocio</label>
                                    <div className="mt-2">
                                        <select id="type" name="type" className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3">
                                            <option value="BUSINESS">Negocio (Bar/Restaurante)</option>
                                            <option value="CLUB">Club Privado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="primaryColor" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Color Primario</label>
                                        <div className="mt-2 flex items-center gap-2">
                                            <input type="color" name="primaryColor" id="primaryColor" defaultValue="#4f46e5" className="h-10 w-full p-1 border border-gray-300 rounded cursor-pointer" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="secondaryColor" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Color Secundario</label>
                                        <div className="mt-2 flex items-center gap-2">
                                            <input type="color" name="secondaryColor" id="secondaryColor" defaultValue="#ffffff" className="h-10 w-full p-1 border border-gray-300 rounded cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Admin Account */}
                            <div className="space-y-6">
                                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Cuenta de Administrador</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Credenciales de acceso inicial.</p>
                                </div>

                                <div>
                                    <label htmlFor="adminName" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Nombre Completo</label>
                                    <div className="mt-2">
                                        <input type="text" name="adminName" id="adminName" required className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="adminEmail" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Correo Electrónico</label>
                                    <div className="mt-2">
                                        <input type="email" name="adminEmail" id="adminEmail" required className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="adminPassword" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Contraseña Temporal</label>
                                    <div className="mt-2">
                                        <input type="password" name="adminPassword" id="adminPassword" required className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" />
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Billar Factory Protocol</h4>
                                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                        Al crear el tenant, se generarán automáticamente 4 mesas de billar y se configurarán los permisos de acceso.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="country" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">País / Región</label>
                            <div className="mt-2">
                                <select id="country" name="country" className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3">
                                    <option value="CL">Chile (CLP - IVA 19%)</option>
                                    <option value="PE">Perú (PEN - IGV 18%)</option>
                                    <option value="MX">México (MXN - IVA 16%)</option>
                                    <option value="ES">España (EUR - IVA 21%)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Tipo de Negocio</label>
                            <div className="mt-2">
                                <select id="type" name="type" className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3">
                                    <option value="BUSINESS">Negocio (Bar/Restaurante)</option>
                                    <option value="CLUB">Club Privado</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="primaryColor" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Color Primario</label>
                                <div className="mt-2 flex items-center gap-2">
                                    <input type="color" name="primaryColor" id="primaryColor" defaultValue="#4f46e5" className="h-10 w-full p-1 border border-gray-300 rounded cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="secondaryColor" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Color Secundario</label>
                                <div className="mt-2 flex items-center gap-2">
                                    <input type="color" name="secondaryColor" id="secondaryColor" defaultValue="#ffffff" className="h-10 w-full p-1 border border-gray-300 rounded cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Admin Account */}
                    <div className="space-y-6">
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Cuenta de Administrador</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Credenciales de acceso inicial.</p>
                        </div>

                        <div>
                            <label htmlFor="adminName" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Nombre Completo</label>
                            <div className="mt-2">
                                <input type="text" name="adminName" id="adminName" required className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="adminEmail" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Correo Electrónico</label>
                            <div className="mt-2">
                                <input type="email" name="adminEmail" id="adminEmail" required className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="adminPassword" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Contraseña Temporal</label>
                            <div className="mt-2">
                                <input type="password" name="adminPassword" id="adminPassword" required className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3" />
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Billar Factory Protocol</h4>
                            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                Al crear el tenant, se generarán automáticamente 4 mesas de billar y se configurarán los permisos de acceso.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8 bg-gray-50 dark:bg-gray-700/50">
                    <button type="button" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-gray-700">Cancelar</button>
                    <button type="submit" className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        Crear Tenant & Assets
                    </button>
                </div>
            </form>
        </div>
    );
}
