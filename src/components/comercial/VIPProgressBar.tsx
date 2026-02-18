'use client';

interface VIPProgressProps {
    currentSpent: number;
    vipThreshold: number;
    currency: string;
}

/**
 * ⚡ VIP Progress Bar - Neon High-Voltage Style
 * For COMERCIAL model only
 */
export default function VIPProgressBar({
    currentSpent,
    vipThreshold,
    currency
}: VIPProgressProps) {
    const progress = Math.min((currentSpent / vipThreshold) * 100, 100);
    const remaining = Math.max(vipThreshold - currentSpent, 0);
    const isVIP = currentSpent >= vipThreshold;

    return (
        <div className="vip-progress neon-voltage">
            <div className="progress-header">
                <span className="icon">💎</span>
                <h3>Camino a VIP</h3>
            </div>

            <div className="progress-bar-container">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    >
                        {progress >= 30 && (
                            <span className="progress-text">{progress.toFixed(0)}%</span>
                        )}
                    </div>
                </div>
                <div className="progress-markers">
                    <span>{currency}0</span>
                    <span>{currency}{vipThreshold.toLocaleString()}</span>
                </div>
            </div>

            {!isVIP ? (
                <p className="progress-message">
                    ¡Estás a <strong className="remaining-amount">{currency}{remaining.toLocaleString()}</strong> de convertirte en <strong>VIP</strong> este mes!
                </p>
            ) : (
                <p className="progress-message success">
                    <span className="celebration">🎉</span>
                    ¡Felicitaciones! Ya calificas como <strong>VIP</strong>
                </p>
            )}

            <div className="benefits-preview">
                <h4>Beneficios VIP:</h4>
                <ul>
                    <li><span className="check">✓</span> 15% descuento en mesas</li>
                    <li><span className="check">✓</span> Reservas prioritarias</li>
                    <li><span className="check">✓</span> Bebida de bienvenida</li>
                </ul>
            </div>

            <style jsx>{`
                .vip-progress.neon-voltage {
                    background: var(--color-primary);
                    border: 1px solid var(--color-secondary);
                    border-radius: var(--border-radius);
                    padding: 20px;
                    box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
                }
                
                .progress-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                
                .icon {
                    font-size: 28px;
                    filter: drop-shadow(0 0 8px rgba(57, 255, 20, 0.8));
                }
                
                .progress-header h3 {
                    margin: 0;
                    font-family: var(--font-heading);
                    font-size: 20px;
                    font-weight: var(--font-heading-weight);
                    color: var(--color-text-primary);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .progress-bar-container {
                    margin-bottom: 16px;
                }
                
                .progress-bar {
                    height: 28px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    overflow: hidden;
                    position: relative;
                    margin-bottom: 8px;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, 
                        var(--color-secondary) 0%, 
                        var(--color-accent) 100%
                    );
                    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 0 15px var(--color-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding-right: 12px;
                    position: relative;
                }
                
                .progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 30%;
                    background: linear-gradient(90deg, 
                        transparent 0%, 
                        rgba(255, 255, 255, 0.3) 100%
                    );
                    animation: shimmer 2s infinite;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                .progress-text {
                    color: var(--color-primary);
                    font-weight: 700;
                    font-size: 14px;
                    text-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
                    z-index: 1;
                }
                
                .progress-markers {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: var(--color-text-secondary);
                }
                
                .progress-message {
                    margin: 12px 0;
                    color: var(--color-text-primary);
                    font-size: 15px;
                    line-height: 1.5;
                }
                
                .progress-message strong {
                    color: var(--color-secondary);
                }
                
                .remaining-amount {
                    font-size: 18px;
                    text-shadow: 0 0 10px var(--color-secondary);
                }
                
                .progress-message.success {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--color-secondary);
                    font-weight: 600;
                }
                
                .celebration {
                    font-size: 24px;
                    animation: bounce 0.8s infinite;
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                
                .benefits-preview {
                    margin-top: 16px;
                    padding: 16px;
                    background: rgba(57, 255, 20, 0.05);
                    border-left: 3px solid var(--color-secondary);
                    border-radius: 4px;
                }
                
                .benefits-preview h4 {
                    margin: 0 0 12px 0;
                    font-family: var(--font-heading);
                    font-size: 13px;
                    font-weight: var(--font-heading-weight);
                    color: var(--color-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .benefits-preview ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .benefits-preview li {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--color-text-primary);
                    font-size: 14px;
                }
                
                .check {
                    color: var(--color-secondary);
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
}
