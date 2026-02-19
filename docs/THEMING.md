# Sistema de Temas Dinámicos 🎨

Este módulo permite la personalización visual de cada tenant (Club o Negocio) basándose en parámetros almacenados en la base de datos, asegurando accesibilidad y consistencia visual.

## Componentes

### ⚙️ Motor de Generación (`theme-generator.ts`)

Encargado de mapear los colores de la base de datos a variables CSS estándar. Proporciona:

- `--color-primary`: Color principal de marca.
- `--color-secondary`: Color de acento.
- `--color-background`: Color de fondo de la página.
- `--color-card`: Color adaptativo para tarjetas (basado en `BusinessModel`).
- `--glow-intensity`: Efectos visuales específicos para modelos comerciales.

### 🛡️ Validación de Sentinel

Todos los temas pasan por una auditoría de contraste automática:

- **Estándar**: WCAG AA (Mínimo 4.5:1).
- **Lógica**: Se compara el `primaryColor` contra el `backgroundColor`.
- **Acción**: Si el contraste es insuficiente, se genera un hallazgo para corrección inmediata.

## Guía de Uso para Soporte

1. Si un cliente reporta que el TPV es difícil de leer, verificar los colores en el panel de administración.
2. Usar la herramienta de auditoría (Sentinel) para validar que el ratio sea mayor a 4.5.
3. El cambio de colores se aplica instantáneamente al recargar el layout del tenant.

---
**Estado**: 🟢 Activo
**Responsable**: Vanguard (UI) & Sentinel (Security)
