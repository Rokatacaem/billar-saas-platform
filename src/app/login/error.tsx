'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-50 p-4">
            <div className="rounded-lg bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong during Login!</h2>
                <div className="mb-4 text-gray-700 font-mono text-sm bg-gray-100 p-4 rounded border overflow-auto max-w-lg text-left">
                    <p className="font-bold mb-2">Message:</p>
                    <p className="bg-white p-2 border rounded mb-2">{error.message || "Unknown client error"}</p>
                    {error.digest && (
                        <>
                            <p className="font-bold mb-1">Digest:</p>
                            <p className="text-xs text-gray-500">{error.digest}</p>
                        </>
                    )}
                </div>
                <p className="text-xs text-gray-400 mb-6 italic">
                    Tip: Si estás en Vercel, revisa los Environment Variables (AUTH_SECRET, DATABASE_URL).
                </p>
                <button
                    onClick={() => reset()}
                    className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
