# Row Level Security (RLS) Policies para Neon

## Objetivo

Implementar una segunda capa de defensa a nivel de base de datos que garantice el aislamiento de tenants incluso si el middleware de la aplicación falla.

## ⚠️ Importante

Prisma no soporta RLS nativamente. Estas políticas deben ejecutarse **manualmente** en la consola SQL de Neon.

---

## Políticas por Tabla

### 1. Tabla `Tenant`

```sql
-- Enable RLS
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins pueden ver todos los tenants
CREATE POLICY tenant_super_admin_all ON "Tenant"
  FOR ALL
  USING (current_setting('app.user_role', true) = 'SUPER_ADMIN');

-- Policy: Usuarios regulares solo ven su propio tenant
CREATE POLICY tenant_isolation ON "Tenant"
  FOR ALL
  USING (id = current_setting('app.tenant_id', true));
```

### 2. Tabla `User`

```sql
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_tenant_isolation ON "User"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true));

CREATE POLICY user_super_admin_all ON "User"
  FOR ALL
  USING (current_setting('app.user_role', true) = 'SUPER_ADMIN');
```

### 3. Tabla `Member`

```sql
ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;

CREATE POLICY member_tenant_isolation ON "Member"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true));
```

### 4. Tabla `Table`

```sql
ALTER TABLE "Table" ENABLE ROW LEVEL SECURITY;

CREATE POLICY table_tenant_isolation ON "Table"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true));
```

### 5. Tabla `UsageLog`

```sql
ALTER TABLE "UsageLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_log_tenant_isolation ON "UsageLog"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true));
```

### 6. Tabla `PaymentRecord`

```sql
ALTER TABLE "PaymentRecord" ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_record_tenant_isolation ON "PaymentRecord"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true));
```

### 7. Tabla `Product`

```sql
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_tenant_isolation ON "Product"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true));
```

### 8. Tabla `DailyBalance`

```sql
ALTER TABLE "DailyBalance" ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_balance_tenant_isolation ON "DailyBalance"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true));
```

### 9. Tabla `ServiceRequest`

```sql
ALTER TABLE "ServiceRequest" ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_request_tenant_isolation ON "ServiceRequest"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true));
```

### 10. Tabla `SystemLog`

```sql
ALTER TABLE "SystemLog" ENABLE ROW LEVEL SECURITY;

-- Logs globales (sin tenant) son visibles solo para super admins
CREATE POLICY system_log_global ON "SystemLog"
  FOR SELECT
  USING ("tenantId" IS NULL AND current_setting('app.user_role', true) = 'SUPER_ADMIN');

-- Logs de tenant son visibles para usuarios de ese tenant
CREATE POLICY system_log_tenant_isolation ON "SystemLog"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true));
```

---

## Configuración de Variables de Sesión

Para que RLS funcione, Prisma debe establecer las variables de sesión en cada conexión. Esto se hace mediante un **Prisma Client Extension** o configuración de conexión.

### Ejemplo en Prisma

```typescript
// src/lib/prisma-rls.ts
import { PrismaClient } from '@prisma/client';

export function withRLS(tenantId: string, userRole: string) {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          // Set session variables antes de cada query
          await prisma.$executeRawUnsafe(\`SET app.tenant_id = '\${tenantId}'\`);
          await prisma.$executeRawUnsafe(\`SET app.user_role = '\${userRole}'\`);
          
          return query(args);
        }
      }
    }
  });
}
```

---

## Verificación

### Test Manual en Neon Console

```sql
-- Simular usuario de tenant 'demo'
SET app.tenant_id = 'clt1demo123';
SET app.user_role = 'ADMIN';

-- Esta query solo debe retornar datos del tenant 'demo'
SELECT * FROM "Member";

-- Reset
RESET app.tenant_id;
RESET app.user_role;
```

### Test de Super Admin

```sql
SET app.user_role = 'SUPER_ADMIN';

-- Debe retornar TODOS los tenants
SELECT * FROM "Tenant";
```

---

## Consideraciones

1. **Performance**: RLS añade overhead mínimo pero verificable. Monitorear con \`EXPLAIN ANALYZE\`.
2. **Prisma Limitations**: Prisma no soporta RLS oficialmente. Las políticas son una capa adicional de seguridad, no un reemplazo del middleware.
3. **Bypass**: Conexiones con rol \`postgres\` (superuser) ignoran RLS. Nunca usar credenciales de superuser en la app.

---

## Desactivar RLS (Solo para Testing)

```sql
ALTER TABLE "Tenant" DISABLE ROW LEVEL SECURITY;
-- Repetir para cada tabla
```
