'use client';

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
}

interface ProductSelectorProps {
    products: Product[];
    onAddProduct: (product: Product) => void;
    isAdding: boolean;
}

export default function ProductSelector({ products, onAddProduct, isAdding }: ProductSelectorProps) {
    // Group products by category? We don't have categories yet. Just a grid.

    return (
        <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[400px] p-2">
            {products.map(product => (
                <button
                    key={product.id}
                    onClick={() => onAddProduct(product)}
                    disabled={isAdding || product.stock <= 0}
                    className={`
                        flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all
                        ${product.stock > 0
                            ? 'bg-white hover:border-indigo-500 hover:shadow-md active:scale-95'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    <span className="font-semibold text-sm">{product.name}</span>
                    <span className="text-indigo-600 font-bold mt-1">${product.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-500 mt-1">Stock: {product.stock}</span>
                </button>
            ))}
        </div>
    );
}
