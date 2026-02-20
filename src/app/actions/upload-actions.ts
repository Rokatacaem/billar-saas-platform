'use server';

import { put } from '@vercel/blob';
import { auth } from '@/auth';

export async function uploadLogo(formData: FormData) {
    const session = await auth();

    // Solo SUPER_ADMIN o ADMIN con permisos pueden subir activos globales
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
        throw new Error('No autorizado');
    }

    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No se ha seleccionado ningún archivo');
    }

    // Validación básica de tipo
    if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
    }

    // Limitar tamaño (ej. 2MB)
    if (file.size > 2 * 1024 * 1024) {
        throw new Error('La imagen excede el límite de 2MB');
    }

    try {
        const blob = await put(`logos/${Date.now()}-${file.name}`, file, {
            access: 'public',
        });

        return { url: blob.url };
    } catch (error) {
        console.error('Error uploading to Vercel Blob:', error);
        throw new Error('Fallo al subir la imagen a la nube');
    }
}
