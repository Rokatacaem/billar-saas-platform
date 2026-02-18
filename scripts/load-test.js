import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    // Simular 50 usuarios concurrentes (managers de clubes)
    vus: 50,
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% de las peticiones deben ser < 500ms
    },
};

const BASE_URL = 'https://billar-saas-platform.vercel.app/api'; // Ajustar si es local

export default function () {
    // Simular carga de dashboard
    const res = http.get(`${BASE_URL}/health`); // Usamos health check como proxy de carga ligera

    check(res, { 'status was 200': (r) => r.status == 200 });

    // Simular polling de notificaciones (lo que más carga genera)
    sleep(1);
}
