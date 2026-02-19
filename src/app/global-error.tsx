'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center bg-red-100 p-4 text-center">
                    <h1 className="text-3xl font-bold text-red-700 mb-2">Critical Error</h1>
                    <p className="font-mono text-sm bg-white p-4 rounded shadow mb-4 max-w-2xl overflow-auto text-left">
                        {error.message || "Unknown global error"}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">Digest: {error.digest}</p>
                    <button
                        onClick={() => reset()}
                        className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                    >
                        Reload Application
                    </button>
                </div>
            </body>
        </html>
    );
}
