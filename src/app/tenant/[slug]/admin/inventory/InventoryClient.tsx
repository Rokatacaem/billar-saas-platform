'use client';

import { useState } from 'react';
import { upsertProduct, deleteProduct } from '@/app/actions/inventory-actions';
import { useRouter } from 'next/navigation';

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
}

interface InventoryClientProps {
    initialProducts: Product[];
    tenantSlug: string;
}

export default function InventoryClient({ initialProducts, tenantSlug }: InventoryClientProps) {
    const router = useRouter();
    const [products, setProducts] = useState(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStock = showLowStock ? p.stock < 5 : true;
        return matchesSearch && matchesStock;
    });

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        const res = await deleteProduct(id);
        if (res.error) {
            alert(res.error);
        } else {
            router.refresh(); // Server Refresh
            // Optimistic Update
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
                <div className="flex gap-4 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="px-4 py-2 border rounded-lg w-full sm:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        onClick={() => setShowLowStock(!showLowStock)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showLowStock ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {showLowStock ? '🔥 Bajo Stock Activo' : 'Alertas de Stock'}
                    </button>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-sm w-full sm:w-auto"
                >
                    + Nuevo Producto
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Precio</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Stock</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                                    No se encontraron productos.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-900 font-medium">{product.name}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-600">${product.price.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm mr-4"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Borrar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                        </div>

                        <form action={async (formData) => {
                            setIsLoading(true);
                            const name = formData.get('name') as string;
                            const price = parseFloat(formData.get('price') as string);
                            const stock = parseInt(formData.get('stock') as string);

                            const res = await upsertProduct({
                                id: editingProduct?.id,
                                name,
                                price,
                                stock
                            });

                            if (res.error) {
                                alert(res.error);
                            } else {
                                router.refresh();
                                closeModal();
                                // Optimistic update (optional but nice)
                            }
                            setIsLoading(false);
                        }}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input
                                        name="name"
                                        defaultValue={editingProduct?.name}
                                        required
                                        placeholder="Ej. Coca Cola Zero"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                                        <input
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            defaultValue={editingProduct?.price}
                                            required
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                                        <input
                                            name="stock"
                                            type="number"
                                            min="0"
                                            defaultValue={editingProduct?.stock}
                                            required
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isLoading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
