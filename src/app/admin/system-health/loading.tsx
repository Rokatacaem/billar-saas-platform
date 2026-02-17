export default function Loading() {
    return (
        <div className="p-8 max-w-7xl mx-auto animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-8"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-32">
                        <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-64 mb-8"></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-64"></div>
        </div>
    );
}
