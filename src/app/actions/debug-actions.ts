'use server';

export async function testAction() {
    console.log("✅ Test Action execution started");
    try {
        const validator = await import('validator');
        console.log("✅ Validator module loaded:", !!validator);
        return { success: true, message: "Server Actions working!" };
    } catch (error) {
        console.error("❌ Test Action failed:", error);
        return { success: false, error: String(error) };
    }
}
