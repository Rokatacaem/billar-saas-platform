'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const memberSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    email: z.string().email("Email inválido").optional().or(z.literal('')),
    rut: z.string().optional(),
    phone: z.string().optional(),
    discount: z.number().min(0).max(100).default(0),
    membershipPlanId: z.string().optional(),
});

export async function createMember(data: z.infer<typeof memberSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error("Unauthorized");
    const tenantId = session.user.tenantId;

    const validated = memberSchema.parse(data);

    try {
        await prisma.member.create({
            data: {
                name: validated.name,
                email: validated.email,
                rut: validated.rut,
                phone: validated.phone,
                discount: validated.discount,
                membershipPlanId: validated.membershipPlanId,
                subscriptionStatus: validated.membershipPlanId ? 'IN_ARREARS' : 'ACTIVE', // Si tiene plan nace debiendo, si no, es active free
                tenantId
            }
        });
        revalidatePath(`/tenant/[slug]/admin/members`);
        return { success: true };
    } catch (error) {
        console.error("Error creating member:", error);
        return { success: false, error: "Failed to create member" };
    }
}

export async function getMembers(query: string = "") {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    return await prisma.member.findMany({
        where: {
            tenantId: session.user.tenantId,
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { rut: { contains: query, mode: 'insensitive' } }
            ]
        },
        include: {
            membershipPlan: true // Incluye plan info para UI
        },
        orderBy: { name: 'asc' }
    });
}
