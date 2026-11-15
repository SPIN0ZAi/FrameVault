import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase';
import { successResponse, unauthorizedError, validationError, serverError } from '@/lib/api-response';
import { z } from 'zod';

const presignSchema = z.object({
    type: z.enum(['avatar', 'banner', 'poster', 'list-banner']),
    movieId: z.union([z.string(), z.number()])
        .transform(val => String(val))
        .pipe(z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid movieId').max(50))
        .optional(),
    listId: z.string().max(100).optional(),
    contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif)(;.*)?$/i, 'Only images are allowed (JPEG, PNG, WebP, GIF)'),
    extension: z.string().regex(/^(jpg|jpeg|png|webp|gif)$/i, 'Invalid extension'),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const body = await req.json();
        const parsed = presignSchema.safeParse(body);

        if (!parsed.success) {
            return validationError(parsed.error.issues[0]?.message ?? 'Invalid input');
        }

        const { type, movieId, listId, extension } = parsed.data;

        if (type === 'poster' && !movieId) {
            return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'movieId is required for poster uploads' } }, { status: 400 });
        }

        const userId = session.user.id;
        const cleanExt = extension.toLowerCase();
        let filePath = '';

        if (type === 'avatar') {
            filePath = `avatars/${userId}-${Date.now()}.${cleanExt}`;
        } else if (type === 'banner') {
            filePath = `banners/${userId}-${Date.now()}.${cleanExt}`;
        } else if (type === 'list-banner') {
            filePath = `list-banners/${listId || userId}-${Date.now()}.${cleanExt}`;
        } else if (type === 'poster') {
            filePath = `posters/custom/${userId}_${movieId}-${Date.now()}.${cleanExt}`;
        }

        const supabase = getSupabaseServerClient();

        // createSignedUploadUrl creates a signed URL for a single file upload using PUT request
        const { data, error } = await supabase.storage
            .from('framevault-media')
            .createSignedUploadUrl(filePath);

        if (error || !data) {
            console.error('Supabase Storage Error:', error);
            return serverError('Failed to generate upload URL. Please ensure your Supabase storage bucket "framevault-media" exists and is public.');
        }

        const supabaseBaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');

        return successResponse({
            uploadUrl: data.signedUrl,
            token: data.token, // Might be present in the returned URL
            path: filePath,
            publicUrl: `${supabaseBaseUrl}/storage/v1/object/public/framevault-media/${filePath}`
        });

    } catch (e) {
        console.error('Presign API Error:', e);
        return serverError('Internal Server Error');
    }
}
