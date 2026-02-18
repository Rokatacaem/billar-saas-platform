'use client';

interface SplitBillModalProps {
    totalAmount: number;
    currency: string;
    onSplit: (splits: SplitPart[]) => void;
    onCancel: () => void;
}

export interface SplitPart {
    partNumber: number;
    amount: number;
    description: string;
}

/**
 * ⚡ Split Bill Modal - Neon High-Voltage Style
 * For COMERCIAL model - Quick bill splitting
 */
export default function SplitBillModal({
    totalAmount,
    currency,
    onSplit,
    onCancel
}: SplitBillModalProps) {
    const [mode, setMode] = useState<'QUICK' | 'CUSTOM'>('QUICK');
    const [parts, setParts] = useState(2);
    const [customSplits, setCustomSplits] = useState<SplitPart[]>([
        { partNumber: 1, amount: totalAmount / 2, description: 'Persona 1' },
        { partNumber: 2, amount: totalAmount / 2, description: 'Persona 2' }
    ]);

    const perPersonAmount = totalAmount / parts;
    const customTotal = customSplits.reduce((sum, split) => sum + split.amount, 0);
    const difference = Math.abs(totalAmount - customTotal);
    const isValid = difference < 0.01; // Tolerance of 1 cent

    const handleQuickSplit = (count: number) => {
        setParts(count);
        setMode('QUICK');
    };

    const handleCustomChange = (index: number, amount: string) => {
        const newSplits = [...customSplits];
        newSplits[index].amount = parseFloat(amount) || 0;
        setCustomSplits(newSplits);
    };

    const handleAddPart = () => {
        setCustomSplits([
            ...customSplits,
            {
                partNumber: customSplits.length + 1,
                amount: 0,
                description: `Persona ${customSplits.length + 1}`
            }
        ]);
    };

    const handleRemovePart = (index: number) => {
        if (customSplits.length <= 2) return;
        setCustomSplits(customSplits.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        if (mode === 'QUICK') {
            const splits: SplitPart[] = Array.from({ length: parts }, (_, i) => ({
                partNumber: i + 1,
                amount: perPersonAmount,
                description: `Persona ${i + 1}`
            }));
            onSplit(splits);
        } else {
            if (!isValid) {
                alert(`Error: La suma (${currency}${customTotal.toFixed(2)}) no coincide con el total (${currency}${totalAmount.toFixed(2)})`);
                return;
            }
            onSplit(customSplits);
        }
    };

    return (
        <div className="split-bill-modal neon-voltage">
            <div className="modal-overlay" onClick={onCancel} />

            <div className="modal-content">
                <div className="modal-header">
                    <h2>➗ Dividir Cuenta</h2>
                    <button onClick={onCancel} className="close-btn">✕</button>
                </div>

                <div className="total-display">
                    <span className="label">Total a Dividir:</span>
                    <span className="amount">{currency}{totalAmount.toLocaleString()}</span>
                </div>

                <div className="mode-selector">
                    <button
                        className={mode === 'QUICK' ? 'active' : ''}
                        onClick={() => setMode('QUICK')}
                    >
                        ⚡ Rápido
                    </button>
                    <button
                        className={mode === 'CUSTOM' ? 'active' : ''}
                        onClick={() => setMode('CUSTOM')}
                    >
                        🎯 Detallado
                    </button>
                </div>

                {mode === 'QUICK' ? (
                    <div className="quick-mode">
                        <p className="instruction">¿Entre cuántas personas?</p>

                        <div className="quick-buttons">
                            {[2, 3, 4, 5, 6].map(count => (
                                <button
                                    key={count}
                                    className={parts === count ? 'active' : ''}
                                    onClick={() => handleQuickSplit(count)}
                                >
                                    {count}
                                </button>
                            ))}
                            <input
                                type="number"
                                min="2"
                                max="20"
                                value={parts}
                                onChange={(e) => handleQuickSplit(parseInt(e.target.value) || 2)}
                                className="custom-input"
                                placeholder="Otro"
                            />
                        </div>

                        <div className="result">
                            <div className="result-card">
                                <span className="result-label">Cada persona paga:</span>
                                <span className="result-amount">
                                    {currency}{perPersonAmount.toLocaleString('es-CL', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="custom-mode">
                        <p className="instruction">Ingresa el monto de cada persona:</p>

                        <div className="custom-splits">
                            {customSplits.map((split, index) => (
                                <div key={index} className="split-row">
                                    <span className="split-number">#{split.partNumber}</span>
                                    <input
                                        type="number"
                                        value={split.amount}
                                        onChange={(e) => handleCustomChange(index, e.target.value)}
                                        className="amount-input"
                                        placeholder="0"
                                    />
                                    {customSplits.length > 2 && (
                                        <button
                                            onClick={() => handleRemovePart(index)}
                                            className="remove-btn"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button onClick={handleAddPart} className="add-part-btn">
                            + Agregar Persona
                        </button>

                        <div className="validation">
                            <div className="validation-row">
                                <span>Suma actual:</span>
                                <span className={isValid ? 'valid' : 'invalid'}>
                                    {currency}{customTotal.toLocaleString()}
                                </span>
                            </div>
                            <div className="validation-row">
                                <span>Diferencia:</span>
                                <span className={isValid ? 'valid' : 'invalid'}>
                                    {currency}{difference.toFixed(2)}
                                </span>
                            </div>
                            {!isValid && (
                                <div className="error-message">
                                    ⚠️ La suma debe coincidir con el total exacto
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="modal-actions">
                    <button onClick={onCancel} className="btn-cancel">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="btn-confirm"
                        disabled={mode === 'CUSTOM' && !isValid}
                    >
                        Generar {mode === 'QUICK' ? parts : customSplits.length} Recibos
                    </button>
                </div>
            </div>

            <style jsx>{`
                .split-bill-modal {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .modal-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(4px);
                }
                
                .modal-content {
                    position: relative;
                    background: var(--color-primary, #000);
                    border: 2px solid var(--color-secondary, #39FF14);
                    border-radius: 8px;
                    padding: 24px;
                    max-width: 500px;
                    width: 100%;
                    box-shadow: 0 0 40px rgba(57, 255, 20, 0.3);
                    color: var(--color-text-primary, #FFF);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(57, 255, 20, 0.3);
                }
                
                .modal-header h2 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--color-secondary, #39FF14);
                    text-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    color: var(--color-text-secondary, #B0B0B0);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    transition: all 0.2s;
                }
                
                .close-btn:hover {
                    color: var(--color-secondary, #39FF14);
                    transform: rotate(90deg);
                }
                
                .total-display {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: rgba(57, 255, 20, 0.05);
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                
                .total-display .label {
                    font-size: 14px;
                    color: var(--color-text-secondary, #B0B0B0);
                }
                
                .total-display .amount {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--color-secondary, #39FF14);
                    text-shadow: 0 0 15px rgba(57, 255, 20, 0.5);
                }
                
                .mode-selector {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                
                .mode-selector button {
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(57, 255, 20, 0.3);
                    border-radius: 8px;
                    color: var(--color-text-primary, #FFF);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .mode-selector button.active {
                    background: rgba(57, 255, 20, 0.2);
                    border-color: var(--color-secondary, #39FF14);
                    box-shadow: 0 0 15px rgba(57, 255, 20, 0.3);
                }
                
                .instruction {
                    text-align: center;
                    margin-bottom: 16px;
                    color: var(--color-text-secondary, #B0B0B0);
                }
                
                .quick-buttons {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 24px;
                }
                
                .quick-buttons button,
                .quick-buttons .custom-input {
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(57, 255, 20, 0.3);
                    border-radius: 8px;
                    color: var(--color-text-primary, #FFF);
                    font-size: 20px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .quick-buttons button:hover,
                .quick-buttons button.active {
                    background: rgba(57, 255, 20, 0.2);
                    border-color: var(--color-secondary, #39FF14);
                    box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);
                    transform: scale(1.05);
                }
                
                .custom-input {
                    text-align: center;
                }
                
                .result {
                    margin-top: 24px;
                }
                
                .result-card {
                    padding: 20px;
                    background: linear-gradient(135deg, 
                        rgba(57, 255, 20, 0.1),
                        rgba(255, 107, 53, 0.1)
                    );
                    border: 2px solid var(--color-secondary, #39FF14);
                    border-radius: 12px;
                    text-align: center;
                    box-shadow: 0 0 30px rgba(57, 255, 20, 0.2);
                }
                
                .result-label {
                    display: block;
                    font-size: 14px;
                    color: var(--color-text-secondary, #B0B0B0);
                    margin-bottom: 8px;
                }
                
                .result-amount {
                    display: block;
                    font-size: 36px;
                    font-weight: 700;
                    color: var(--color-secondary, #39FF14);
                    text-shadow: 0 0 20px rgba(57, 255, 20, 0.6);
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                
                .custom-splits {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                
                .split-row {
                    display: grid;
                    grid-template-columns: 40px 1fr 40px;
                    gap: 12px;
                    align-items: center;
                }
                
                .split-number {
                    text-align: center;
                    font-weight: 700;
                    color: var(--color-secondary, #39FF14);
                }
                
                .amount-input {
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(57, 255, 20, 0.3);
                    border-radius: 8px;
                    color: var(--color-text-primary, #FFF);
                    font-size: 16px;
                    text-align: right;
                }
                
                .remove-btn {
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.5);
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    color: #ef4444;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .remove-btn:hover {
                    background: rgba(239, 68, 68, 0.4);
                    transform: scale(1.1);
                }
                
                .add-part-btn {
                    width: 100%;
                    padding: 12px;
                    background: rgba(57, 255, 20, 0.1);
                    border: 1px dashed var(--color-secondary, #39FF14);
                    border-radius: 8px;
                    color: var(--color-secondary, #39FF14);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 20px;
                }
                
                .add-part-btn:hover {
                    background: rgba(57, 255, 20, 0.2);
                }
                
                .validation {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                
                .validation-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .validation-row .valid {
                    color: var(--color-secondary, #39FF14);
                    font-weight: 700;
                }
                
                .validation-row .invalid {
                    color: #ef4444;
                    font-weight: 700;
                }
                
                .error-message {
                    margin-top: 12px;
                    padding: 8px 12px;
                    background: rgba(239, 68, 68, 0.1);
                    border-left: 3px solid #ef4444;
                    color: #ef4444;
                    font-size: 14px;
                }
                
                .modal-actions {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 12px;
                    margin-top: 24px;
                }
                
                button {
                    padding: 14px 24px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-cancel {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--color-text-secondary, #B0B0B0);
                }
                
                .btn-cancel:hover {
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .btn-confirm {
                    background: linear-gradient(90deg, 
                        var(--color-secondary, #39FF14), 
                        var(--color-accent, #FF6B35)
                    );
                    color: #000;
                    box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);
                }
                
                .btn-confirm:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 30px rgba(57, 255, 20, 0.6);
                }
                
                .btn-confirm:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
