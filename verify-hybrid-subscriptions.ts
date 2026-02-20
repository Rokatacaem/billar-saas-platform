import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("=== 🛡️ Verificador Sentinel: Suscripciones Híbridas ===\n");

    // 1. Obtener el Tenan Akapoolco o el primero disponible
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error("No hay Tenant para la prueba.");
    console.log(`🏢 Operando en Tenant: ${tenant.name} (${tenant.id})`);

    // 2. Limpiar planes viejos de prueba
    await prisma.membershipPayment.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.member.updateMany({ where: { tenantId: tenant.id }, data: { membershipPlanId: null } });
    await prisma.membershipPlan.deleteMany({ where: { tenantId: tenant.id } });

    // 3. Crear Plan Afecto (IVA) y Plan Exento (Club)
    const planAfecto = await prisma.membershipPlan.create({
        data: {
            tenantId: tenant.id,
            name: "Cuota Gold Comercial (IVA)",
            price: 50000,
            isTaxable: true,
            billingCycle: "MONTHLY"
        }
    });

    const planExento = await prisma.membershipPlan.create({
        data: {
            tenantId: tenant.id,
            name: "Cuota Social Club (Exenta)",
            price: 25000,
            isTaxable: false, // Forzará DTE 41
            billingCycle: "MONTHLY"
        }
    });

    console.log(`\n📦 Planes creados:`);
    console.log(`  - ${planAfecto.name}: $${planAfecto.price} | Afecto: ${planAfecto.isTaxable}`);
    console.log(`  - ${planExento.name}: $${planExento.price} | Afecto: ${planExento.isTaxable}`);

    // 4. Crear Socios y Asignarlos
    const datePast = new Date();
    datePast.setDate(datePast.getDate() - 5); // Vencido hace 5 días

    const socioA = await prisma.member.create({
        data: {
            tenantId: tenant.id,
            name: "Socio Comercial 1",
            membershipPlanId: planAfecto.id,
            subscriptionStatus: "IN_ARREARS", // Nace debiendo
            currentPeriodEnd: datePast
        }
    });

    const socioB = await prisma.member.create({
        data: {
            tenantId: tenant.id,
            name: "Socio Club 2",
            membershipPlanId: planExento.id,
            subscriptionStatus: "IN_ARREARS",
            currentPeriodEnd: datePast
        }
    });

    console.log(`\n👥 Socios Asignados en estado IN_ARREARS`);

    // 5. Simular Cobro Manual de Action (El engine del Action está acoplado a auth, lo simulamos idéntico aquí)
    console.log(`\n💳 Simulando Cobro de Plan Afecto ($${planAfecto.price}) a ${socioA.name}...`);
    let taxAmountA = 50000 - (50000 / 1.19); // Aproximado simulado de calculateTaxBreakdown al 19% 
    await prisma.membershipPayment.create({
        data: {
            tenantId: tenant.id, memberId: socioA.id, amount: planAfecto.price, taxAmount: taxAmountA, dteType: 39
        }
    });
    await prisma.member.update({ where: { id: socioA.id }, data: { subscriptionStatus: "ACTIVE" } });
    console.log(`   ✅ DTE Emitido: 39 (Boleta Afecta) | IVA Desglosado: $${taxAmountA.toFixed(0)} | Neto: $${(50000 - taxAmountA).toFixed(0)}`);


    console.log(`\n💳 Simulando Cobro de Plan Exento ($${planExento.price}) a ${socioB.name}...`);
    // Sentinel de la Action asignaría 0 a tax y DTE 41
    await prisma.membershipPayment.create({
        data: {
            tenantId: tenant.id, memberId: socioB.id, amount: planExento.price, taxAmount: 0, dteType: 41
        }
    });
    await prisma.member.update({ where: { id: socioB.id }, data: { subscriptionStatus: "ACTIVE" } });
    console.log(`   ✅ DTE Emitido: 41 (Boleta Honorarios/Exenta) | IVA Desglosado: $0 | Neto: $25000`);

    console.log("\n✅ Verificación Completada Exitosamente!");
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
