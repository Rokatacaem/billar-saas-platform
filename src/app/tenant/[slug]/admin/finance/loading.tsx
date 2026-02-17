export default function Loading() {
    return (
        <div className="p-6 max-w-7xl mx-auto animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-10 bg-gray-100 border-b border-gray-200"></div>
                <div className="p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex space-x-4">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            <div className="flex-1"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
