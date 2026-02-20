'use client';

import { useState } from 'react';
import { upsertProduct, deleteProduct } from '@/app/actions/inventory-actions';
import { useRouter } from 'next/navigation';

interface Product {
    id: string;
    name: string;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    sku: string | null;
    recipes?: RecipeItem[];
}

interface RecipeItem {
    id: string;
    ingredientId: string;
    quantity: number;
    ingredient: {
        name: string;
    };
}

interface InventoryClientProps {
    initialProducts: Product[];
}

export default function InventoryClient({ initialProducts }: InventoryClientProps) {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Recipe Management State
    const [recipeIngredients, setRecipeIngredients] = useState<{ id: string, name: string, qty: number }[]>([]);

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStock = showLowStock ? p.stock < 5 : true;
        return matchesSearch && matchesStock;
    });

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setRecipeIngredients(product.recipes?.map(r => ({
            id: r.ingredientId,
            name: r.ingredient.name,
            qty: r.quantity
        })) || []);
        setIsModalOpen(true);
    };

    const getStockStatus = (product: Product) => {
        const min = product.minStock || 5;
        if (product.stock <= min * 0.5) return { color: '#ef4444', label: 'Crítico', bg: '#fee2e2' };
        if (product.stock <= min) return { color: '#f59e0b', label: 'Aviso', bg: '#fef3c7' };
        return { color: '#10b981', label: 'Normal', bg: '#d1fae5' };
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
                    className="px-6 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-hover)] font-semibold shadow-sm w-full sm:w-auto"
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
                                        {(() => {
                                            const status = getStockStatus(product);
                                            return (
                                                <div className="flex flex-col items-center">
                                                    <span
                                                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1"
                                                        style={{ backgroundColor: status.bg, color: status.color }}
                                                    >
                                                        {status.label}
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-700">
                                                        {product.stock}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs mr-4 transition-colors"
                                        >
                                            Editar / Receta
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const reason = prompt(`Razón de la merma para ${product.name}:`);
                                                if (!reason) return;
                                                const qty = prompt(`Cantidad a descontar (ej: 1):`);
                                                if (!qty || isNaN(parseFloat(qty))) return;

                                                const { recordManualMovement } = await import('@/app/actions/inventory-actions');
                                                const res = await recordManualMovement(product.id, -parseFloat(qty), 'MERMA', reason);
                                                if (res.success) router.refresh();
                                                else alert(res.error);
                                            }}
                                            className="text-amber-600 hover:text-amber-800 font-bold text-xs mr-4 transition-colors"
                                        >
                                            Merma
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-gray-400 hover:text-rose-600 font-bold text-xs transition-colors"
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
                            <h3 className="font-bold text-lg text-gray-800">{editingProduct ? 'Configurar Producto & Receta' : 'Nuevo Producto'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                        </div>

                        <form action={async (formData) => {
                            setIsLoading(true);
                            const name = formData.get('name') as string;
                            const sku = formData.get('sku') as string;
                            const price = parseFloat(formData.get('price') as string);
                            const costPrice = parseFloat(formData.get('costPrice') as string) || 0;
                            const stock = parseInt(formData.get('stock') as string);
                            const minStock = parseInt(formData.get('minStock') as string) || 5;

                            try {
                                const res = await upsertProduct({
                                    id: editingProduct?.id,
                                    name,
                                    sku,
                                    price,
                                    costPrice,
                                    stock,
                                    minStock
                                });

                                if (res.success && editingProduct?.id) {
                                    const { saveRecipe } = await import('@/app/actions/inventory-actions');
                                    await saveRecipe(editingProduct.id, recipeIngredients.map(ri => ({
                                        ingredientId: ri.id,
                                        quantity: ri.qty
                                    })));
                                }

                                if (res.error) {
                                    alert(res.error);
                                } else {
                                    router.refresh();
                                    closeModal();
                                }
                            } catch (e) {
                                console.error(e);
                                alert("Error al guardar");
                            }
                            setIsLoading(false);
                        }}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label htmlFor="prod-name" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nombre</label>
                                        <input
                                            id="prod-name"
                                            name="name"
                                            defaultValue={editingProduct?.name}
                                            required
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label htmlFor="prod-sku" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">SKU / Código</label>
                                        <input
                                            id="prod-sku"
                                            name="sku"
                                            defaultValue={editingProduct?.sku || ''}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="prod-price" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Precio Venta</label>
                                        <input
                                            id="prod-price"
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingProduct?.price}
                                            required
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-600"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="prod-cost" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Costo Base</label>
                                        <input
                                            id="prod-cost"
                                            name="costPrice"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingProduct?.costPrice}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="prod-stock" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock Actual</label>
                                        <input
                                            id="prod-stock"
                                            name="stock"
                                            type="number"
                                            defaultValue={editingProduct?.stock}
                                            required
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="prod-min" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock Mínimo</label>
                                        <input
                                            id="prod-min"
                                            name="minStock"
                                            type="number"
                                            defaultValue={editingProduct?.minStock || 5}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                {/* Recipe Editor Section */}
                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        📦 Composición de Receta (Escandallo)
                                    </h4>

                                    <div className="space-y-2 mb-4">
                                        {recipeIngredients.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                <span className="flex-1 text-xs font-bold text-gray-700">{item.name}</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.qty}
                                                    aria-label={`Cantidad de ${item.name}`}
                                                    onChange={(e) => {
                                                        const newArr = [...recipeIngredients];
                                                        newArr[idx].qty = parseFloat(e.target.value);
                                                        setRecipeIngredients(newArr);
                                                    }}
                                                    className="w-20 px-2 py-1 border rounded text-xs font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx))}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <select
                                        id="ingredient-selector"
                                        className="w-full px-4 py-2 border rounded-xl text-xs font-medium bg-white"
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            if (!id) return;
                                            const prod = products.find(p => p.id === id);
                                            if (prod) {
                                                setRecipeIngredients([...recipeIngredients, { id: prod.id, name: prod.name, qty: 1 }]);
                                            }
                                            e.target.value = "";
                                        }}
                                    >
                                        <option value="">+ Añadir Ingrediente...</option>
                                        {products.filter(p => !recipeIngredients.find(ri => ri.id === p.id) && p.id !== editingProduct?.id).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-[10px] text-gray-400 italic text-center">
                                        * El costo se recalcula automáticamente al guardar.
                                    </p>
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
                                    className="px-6 py-2 bg-[var(--theme-primary)] text-white font-semibold rounded-lg hover:bg-[var(--theme-primary-hover)] disabled:opacity-50"
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
