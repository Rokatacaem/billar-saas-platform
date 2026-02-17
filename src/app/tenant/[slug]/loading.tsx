export default function Loading() {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 animate-pulse">
            {/* Admin Bar Skeleton */}
            <div className="mb-8 p-4 bg-gray-50 rounded-xl h-24"></div>

            <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>

            {/* Tables Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-gray-100"></div>
                        <div className="h-4 w-12 bg-gray-100 rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
