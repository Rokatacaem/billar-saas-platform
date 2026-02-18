'use client';

import { useState, useEffect } from 'react';
import { createLead } from '@/app/actions/lead-actions';

interface LeadFormProps {
    detectedCountry: string;
    detectedCurrency: string;
}

export default function LeadForm({ detectedCountry, detectedCurrency }: LeadFormProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formStartTime, setFormStartTime] = useState<number>(0);

    // 🛡️ SENTINEL: Track form start time for bot detection
    useEffect(() => {
        setFormStartTime(Date.now());
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        // 🛡️ SENTINEL: Calculate form fill time
        const formFillTime = (Date.now() - formStartTime) / 1000; // segundos

        const formData = new FormData(e.currentTarget);
        formData.append('detectedCurrency', detectedCurrency);
        formData.append('formFillTime', formFillTime.toString());

        const result = await createLead(formData);

        if (result.success) {
            setSuccess(true);
            (e.target as HTMLFormElement).reset();
        } else {
            setError(result.error || 'Error al enviar');
        }

        setLoading(false);
    }

    if (success) {
        return (
            <div className="lead-form-success">
                <h3>✅ ¡Gracias por tu interés!</h3>
                <p>Nos pondremos en contacto contigo pronto.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="lead-form">
            <h3>Solicitar Demo</h3>
            <p className="lead-form-subtitle">
                Descubre cómo transformar tu club con tecnología profesional
            </p>

            <div className="form-grid">
                <div className="form-field">
                    <label htmlFor="name">Nombre *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder="Juan Pérez"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="email">Email *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        placeholder="juan@miclub.com"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="country">País *</label>
                    <input
                        type="text"
                        id="country"
                        name="country"
                        required
                        defaultValue={detectedCountry}
                        placeholder="Chile"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="phone">Teléfono</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="+56 9 1234 5678"
                    />
                </div>
            </div>

            <div className="form-field">
                <label htmlFor="message">Mensaje (opcional)</label>
                <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Cuéntanos sobre tu club o federación..."
                ></textarea>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Enviando...' : 'Solicitar Demo Gratuita'}
            </button>

            <p className="form-privacy">
                Al enviar, aceptas nuestras <a href="/privacy">políticas de privacidad</a>
            </p>

            <style jsx>{`
                .lead-form {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    max-width: 600px;
                    margin: 0 auto;
                }

                .lead-form h3 {
                    margin: 0 0 0.5rem 0;
                    color: #1a4d2e;
                    font-size: 1.8rem;
                }

                .lead-form-subtitle {
                    color: #666;
                    margin-bottom: 2rem;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                @media (max-width: 768px) {
                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .form-field {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-field label {
                    font-weight: 600;
                    color: #333;
                    font-size: 0.95rem;
                }

                .form-field input,
                .form-field textarea {
                    padding: 0.75rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s;
                }

                .form-field input:focus,
                .form-field textarea:focus {
                    outline: none;
                    border-color: #1a4d2e;
                }

                .form-error {
                    background: #fee;
                    color: #c00;
                    padding: 0.75rem;
                    border-radius: 6px;
                    margin-bottom: 1rem;
                }

                .btn-primary {
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #1a4d2e, #2d7a50);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(26, 77, 46, 0.3);
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .form-privacy {
                    text-align: center;
                    font-size: 0.85rem;
                    color: #666;
                    margin-top: 1rem;
                }

                .form-privacy a {
                    color: #1a4d2e;
                    text-decoration: underline;
                }

                .lead-form-success {
                    background: linear-gradient(135deg, #d4edda, #c3e6cb);
                    border-radius: 12px;
                    padding: 3rem 2rem;
                    text-align: center;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .lead-form-success h3 {
                    color: #155724;
                    margin: 0 0 1rem 0;
                    font-size: 2rem;
                }

                .lead-form-success p {
                    color: #155724;
                    font-size: 1.1rem;
                }
            `}</style>
        </form>
    );
}
