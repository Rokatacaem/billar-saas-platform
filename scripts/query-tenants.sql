SELECT id,
    name,
    slug,
    "businessModel",
    type,
    status
FROM "Tenant"
ORDER BY "createdAt" DESC
LIMIT 20;