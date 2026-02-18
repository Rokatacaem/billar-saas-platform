'use client';

import { useState } from 'react';
import { simpleAction } from '../actions/simple-test';

export default function TestPage() {
    const [result, setResult] = useState<string>('');

    return (
        <div className="p-8">
            <h1>Server Action Test</h1>
            <button
                className="bg-blue-500 text-white p-2 rounded mt-4"
                onClick={async () => {
                    try {
                        const res = await simpleAction();
                        setResult(res.message);
                    } catch (e) {
                        setResult('Error: ' + String(e));
                    }
                }}
            >
                Run Server Action
            </button>
            <pre className="mt-4 p-4 bg-gray-100">{result}</pre>
        </div>
    );
}
