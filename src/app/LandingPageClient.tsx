'use client';

import Link from 'next/link';
import LeadForm from '@/components/LeadForm';
import { convertPrice, formatPrice } from '@/lib/currency-detector';

interface LandingPageClientProps {
    location: {
        countryName: string;
        currency: string;
        currencySymbol: string;
    };
    pricingPlans: Array<{
        name: string;
        baseUSD: number;
        features: string[];
    }>;
}

export default function LandingPageClient({ location, pricingPlans }: LandingPageClientProps) {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <h1 className="hero-title">
                        La Infraestructura Global para el Billar Pool
                    </h1>
                    <p className="hero-subtitle">
                        Gestión, Analítica y Fidelización para Clubes y Federaciones
                    </p>
                    <p className="hero-location">
                        🌍 Detectado: {location.countryName} • {location.currency}
                    </p>
                    <div className="hero-cta">
                        <a href="#solicitar-demo" className="btn-primary">
                            Solicitar Demo Gratuita
                        </a>
                        <Link href="/tenant/demo/tables" className="btn-secondary">
                            Ver Demo en Vivo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Showcase */}
            <section className="features">
                <div className="container">
                    <h2>Todo lo que necesitas en una sola plataforma</h2>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🎱</div>
                            <h3>Control de Mesas</h3>
                            <p>Monitoreo en tiempo real de todas tus mesas. Timing automático, facturación inteligente.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🍺</div>
                            <h3>TPV & Bar</h3>
                            <p>Gestión de inventario, control de stock, reportes de ventas. Todo integrado.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>BI & Analytics</h3>
                            <p>Dashboards de rentabilidad, análisis de horarios pico, métricas de socios.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📱</div>
                            <h3>Portal QR</h3>
                            <p>Tus socios piden desde la mesa. Experiencia premium sin fricciones.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🌐</div>
                            <h3>Multi-Moneda</h3>
                            <p>Opera en cualquier país. Soporte para CLP, USD, EUR, MXN, PEN, ARS y más.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🔒</div>
                            <h3>Seguridad Bancaria</h3>
                            <p>Encriptación de grado militar. Cumplimiento OWASP. Tu data protegida.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing">
                <div className="container">
                    <h2>Planes adaptados a tu realidad</h2>
                    <p className="pricing-subtitle">
                        Precios en {location.currencySymbol} {location.currency} para {location.countryName}
                    </p>

                    <div className="pricing-grid">
                        {pricingPlans.map(plan => {
                            const localPrice = convertPrice(plan.baseUSD, location.currency);
                            const formattedPrice = formatPrice(localPrice, location.currency);

                            return (
                                <div key={plan.name} className={`pricing-card ${plan.name === 'PRO' ? 'featured' : ''}`}>
                                    {plan.name === 'PRO' && <div className="badge">Más Popular</div>}
                                    <h3>{plan.name}</h3>
                                    <div className="price">
                                        {formattedPrice}
                                        <span className="period">/mes</span>
                                    </div>
                                    <ul className="features-list">
                                        {plan.features.map(feature => (
                                            <li key={feature}>✓ {feature}</li>
                                        ))}
                                    </ul>
                                    <a href="#solicitar-demo" className="btn-pricing">
                                        Comenzar Ahora
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Lead Capture Form */}
            <section id="solicitar-demo" className="demo-section">
                <div className="container">
                    <LeadForm
                        detectedCountry={location.countryName}
                        detectedCurrency={location.currency}
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <p>© 2026 Billar SaaS Platform • Hecho para el mundo del billar pool</p>
                    <div className="footer-links">
                        <Link href="/privacy">Privacidad</Link>
                        <Link href="/terms">Términos</Link>
                        <Link href="/contact">Contacto</Link>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                .landing-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }

                /* Hero Section */
                .hero {
                    background: linear-gradient(135deg, #1a4d2e 0%, #2d7a50 100%);
                    color: white;
                    padding: 6rem 0;
                    text-align: center;
                }

                .hero-title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin: 0 0 1rem 0;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
                }

                .hero-subtitle {
                    font-size: 1.5rem;
                    margin: 0 0 1rem 0;
                    opacity: 0.95;
                }

                .hero-location {
                    font-size: 1.1rem;
                    opacity: 0.9;
                    margin-bottom: 2rem;
                }

                .hero-cta {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .btn-primary {
                    padding: 1rem 2.5rem;
                    background: white;
                    color: #1a4d2e;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    text-decoration: none;
                    transition: transform 0.3s, box-shadow 0.3s;
                    display: inline-block;
                }

                .btn-primary:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                }

                .btn-secondary {
                    padding: 1rem 2.5rem;
                    background: transparent;
                    color: white;
                    border: 2px solid white;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    text-decoration: none;
                    transition: background 0.3s;
                    display: inline-block;
                }

                .btn-secondary:hover {
                    background: rgba(255,255,255,0.1);
                }

                /* Features Section */
                .features {
                    padding: 5rem 0;
                }

                .features h2 {
                    text-align: center;
                    font-size: 2.5rem;
                    color: #1a4d2e;
                    margin-bottom: 3rem;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .feature-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    transition: transform 0.3s, box-shadow 0.3s;
                }

                .feature-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                }

                .feature-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .feature-card h3 {
                    color: #1a4d2e;
                    margin-bottom: 0.75rem;
                    font-size: 1.4rem;
                }

                .feature-card p {
                    color: #666;
                    line-height: 1.6;
                }

                /* Pricing Section */
                .pricing {
                    background: white;
                    padding: 5rem 0;
                }

                .pricing h2 {
                    text-align: center;
                    font-size: 2.5rem;
                    color: #1a4d2e;
                    margin-bottom: 0.5rem;
                }

                .pricing-subtitle {
                    text-align: center;
                    color: #666;
                    font-size: 1.1rem;
                    margin-bottom: 3rem;
                }

                .pricing-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 2rem;
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .pricing-card {
                    background: #f8f9fa;
                    padding: 2.5rem 2rem;
                    border-radius: 16px;
                    text-align: center;
                    position: relative;
                    border: 2px solid #e9ecef;
                    transition: transform 0.3s, box-shadow 0.3s;
                }

                .pricing-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.12);
                }

                .pricing-card.featured {
                    background: linear-gradient(135deg, #1a4d2e 0%, #2d7a50 100%);
                    color: white;
                    border-color: #1a4d2e;
                }

                .badge {
                    position: absolute;
                    top: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: gold;
                    color: #333;
                    padding: 0.5rem 1.5rem;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 0.85rem;
                }

                .pricing-card h3 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    color: inherit;
                }

                .price {
                    font-size: 3rem;
                    font-weight: 800;
                    margin-bottom: 2rem;
                    color: inherit;
                }

                .period {
                    font-size: 1rem;
                    font-weight: 400;
                    opacity: 0.8;
                }

                .features-list {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 2rem 0;
                    text-align: left;
                }

                .features-list li {
                    padding: 0.5rem 0;
                    color: inherit;
                }

                .btn-pricing {
                    display: block;
                    padding: 1rem;
                    background: #1a4d2e;
                    color: white;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: background 0.3s;
                }

                .pricing-card.featured .btn-pricing {
                    background: white;
                    color: #1a4d2e;
                }

                .btn-pricing:hover {
                    background: #2d7a50;
                }

                .pricing-card.featured .btn-pricing:hover {
                    background: #f0f0f0;
                }

                /* Demo Section */
                .demo-section {
                    padding: 5rem 0;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                }

                /* Footer */
                .footer {
                    background: #1a4d2e;
                    color: white;
                    padding: 2rem 0;
                    text-align: center;
                }

                .footer-links {
                    display: flex;
                    gap: 2rem;
                    justify-content: center;
                    margin-top: 1rem;
                }

                .footer-links a {
                    color: white;
                    text-decoration: none;
                    transition: opacity 0.3s;
                }

                .footer-links a:hover {
                    opacity: 0.7;
                }

                @media (max-width: 768px) {
                    .hero-title {
                        font-size: 2.5rem;
                    }

                    .hero-subtitle {
                        font-size: 1.2rem;
                    }

                    .features h2, .pricing h2 {
                        font-size: 2rem;
                    }
                }
            `}</style>
        </div>
    );
}
