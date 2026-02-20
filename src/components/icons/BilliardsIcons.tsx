'use client';

import React from 'react';

// Interfaz Compartida para las propiedades visuales.
// Consumen `var(--theme-primary)` en caso de que no se pase color y permiten sobre-escritura.
export interface BilliardIconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    currentColor?: string;
}

export function CueIcon({ size = 24, currentColor = 'var(--theme-primary)', className = '', ...props }: BilliardIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            <path
                d="M4.5 19.5L19.5 4.5M3 21l2-2M21 3l-2 2"
                stroke={currentColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="19.5" cy="4.5" r="1.5" fill={currentColor} />
            <path
                d="M7.5 16.5L11.5 12.5"
                stroke={currentColor}
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function PoolTableIcon({ size = 24, currentColor = 'var(--theme-primary)', className = '', ...props }: BilliardIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`pool-table-icon ${className}`}
            {...props}
        >
            <style>
                {`
                    [data-table-style="classic"] .table-frame { stroke: var(--theme-secondary); }
                    [data-table-style="neon"] .table-frame {
                        stroke: ${currentColor};
                        filter: drop-shadow(0 0 4px ${currentColor});
                    }
                    [data-table-style="minimal"] .table-frame { stroke: ${currentColor}; stroke-width: 1; }
                `}
            </style>
            <rect className="table-frame" x="2" y="5" width="20" height="14" rx="2" stroke={currentColor} strokeWidth="2" />
            <circle cx="6" cy="9" r="1" fill={currentColor} />
            <circle cx="12" cy="12" r="1" fill={currentColor} />
            <circle cx="18" cy="15" r="1" fill={currentColor} />
            {/* Pockets */}
            <path className="table-frame" d="M4 5L5 6M20 5L19 6M4 19L5 18M20 19L19 18M12 5V6M12 19V18" stroke={currentColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function EightBallIcon({ size = 24, currentColor = 'var(--theme-primary)', className = '', ...props }: BilliardIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            <circle cx="12" cy="12" r="10" stroke={currentColor} strokeWidth="2" fill="transparent" />
            <circle cx="12" cy="10" r="4" fill={currentColor} />
            {/* El Numero 8 */}
            <path
                d="M12 8C11.4477 8 11 8.44772 11 9C11 9.55228 11.4477 10 12 10C12.5523 10 13 9.55228 13 9C13 8.44772 12.5523 8 12 8ZM12 10C11.4477 10 11 10.4477 11 11C11 11.5523 11.4477 12 12 12C12.5523 12 13 11.5523 13 11C13 10.4477 12.5523 10 12 10Z"
                fill="var(--theme-bg, white)"
            />
        </svg>
    );
}
