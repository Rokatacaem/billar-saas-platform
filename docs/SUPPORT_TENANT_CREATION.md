# Guía Scribe: Alta de Nuevos Tenants 🏭

Esta guía detalla el procedimiento para el equipo de soporte técnico al provisionar un nuevo cliente en la Billar SaaS Platform.

## 🚀 Proceso de 4 Pasos

El formulario en `/admin/tenants/new` automatiza la creación de infraestructura siguiendo el **Billar Factory Protocol**.

### 1. Datos del Establecimiento

- **Nombre**: Marca comercial del cliente.
- **Slug**: Identificador único para el subdominio.

> [!WARNING]
> Sentinel audita que no se usen caracteres especiales. El sistema sanitiza automáticamente (Ej: "Billar Club" -> `billar-club`).

### 2. Selección del Modelo

- **CLUB_SOCIOS**: Activa módulos de membresías, cuotas y categorías VIP.
- **COMERCIAL**: Configura el sistema para venta directa (POS rápido) y clientes transitorios.

### 3. Identidad Visual (Branding)

- **Preview en Tiempo Real**: El sistema audita el contraste (Sentinel Alert) para garantizar accesibilidad WCAG AA.
- **Piel Dinámica**: Se inyectan variables CSS (`--color-primary`, `--color-background`) basadas en esta configuración.

### 4. Acceso Maestro

- Se crea un usuario con rol `ADMIN` vinculado exclusivamente al nuevo `tenantId`.
- **Assets Automáticos**: El protocolo crea por defecto **4 mesas de billar** disponibles inmediatamente.

## 🛡️ Auditoría Sentinel

Cualquier intento de creación por un usuario que no sea `SUPER_ADMIN` será bloqueado y registrado como un evento de seguridad crítico.

## 🛠️ Resolución de Errores

- **Slug en uso**: Cada tenant debe tener un subdominio único.
- **Contraste insuficiente**: Si el indicador Sentinel es rojo, se debe ajustar el color primario o de fondo para asegurar legibilidad.
