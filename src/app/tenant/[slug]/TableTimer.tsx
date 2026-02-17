'use client';

import { useState, useEffect } from 'react';

interface Props {
    startTime: Date | null;
    primaryColor: string;
}

export default function TableTimer({ startTime, primaryColor }: Props) {
    const [elapsed, setElapsed] = useState<string>("00:00");

    useEffect(() => {
        if (!startTime) return;

        const start = new Date(startTime).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = now - start;

            if (diff < 0) {
                setElapsed("00:00");
                return;
            }

            const totalSeconds = Math.floor(diff / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const hours = Math.floor(minutes / 60);
            const displayMinutes = minutes % 60;

            const fmt = (n: number) => n.toString().padStart(2, '0');

            if (hours > 0) {
                setElapsed(`${fmt(hours)}:${fmt(displayMinutes)}:${fmt(seconds)}`);
            } else {
                setElapsed(`${fmt(displayMinutes)}:${fmt(seconds)}`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    if (!startTime) return null;

    return (
        <div
            className="mt-2 text-xl font-mono font-bold"
            style={{ color: primaryColor }}
        >
            {elapsed}
        </div>
    );
}
