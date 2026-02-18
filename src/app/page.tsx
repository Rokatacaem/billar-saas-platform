import { detectLocation } from '@/lib/currency-detector';
import LandingPageClient from './LandingPageClient';

export default async function LandingPage() {
    // Detectar ubicación del visitante
    const location = await detectLocation();

    // Precios base en USD
    const pricingPlans = [
        { name: 'BASIC', baseUSD: 49, features: ['5 Mesas', 'TPV Básico', 'Reportes Mensuales'] },
        { name: 'PRO', baseUSD: 99, features: ['15 Mesas', 'TPV + Bar', 'BI en Tiempo Real', 'Portal QR'] },
        { name: 'ENTERPRISE', baseUSD: 199, features: ['Mesas Ilimitadas', 'Todo PRO +', 'Soporte Prioritario', 'Multitienda'] }
    ];

    return (
        <LandingPageClient
            location={location}
            pricingPlans={pricingPlans}
        />
    );
}
