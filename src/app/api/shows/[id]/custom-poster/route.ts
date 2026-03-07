import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, serverError, validationError } from '@/lib/api-response';

const ALLOWED_URL_ORIGINS = [
    'https://image.tmdb.org',
    process.env.NEXT_PUBLIC_SUPABASE_URL,
].filter(Boolean) as string[];

function isAllowedPosterUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        return ALLOWED_URL_ORIGINS.some(origin => url.startsWith(origin));
    } catch {
        return false;
    }
}

// POST /api/shows/[id]/custom-poster — set a custom poster for a TV show
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { id } = await params;
        const tmdbShowId = parseInt(id);
        if (isNaN(tmdbShowId)) return NextResponse.json({ success: false, error: { message: 'Invalid show ID' } }, { status: 400 });

        const { posterUrl } = await req.json();
        if (!posterUrl) return NextResponse.json({ success: false, error: { message: 'posterUrl is required' } }, { status: 400 });
        if (!isAllowedPosterUrl(posterUrl)) return validationError('Invalid poster URL: must be from a trusted source');

        await prisma.showCustomPoster.upsert({
            where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
            update: { posterUrl },
            create: { userId: session.user.id, tmdbShowId, posterUrl },
        });

        return successResponse({ updated: true, posterUrl });
    } catch (error) {
        console.error('POST show custom-poster error:', error);
        return serverError('Failed to save custom poster');
    }
}

// DELETE /api/shows/[id]/custom-poster — remove custom poster (revert to TMDB)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { id } = await params;
        const tmdbShowId = parseInt(id);

        await prisma.showCustomPoster.deleteMany({
            where: { userId: session.user.id, tmdbShowId },
        });

        return successResponse({ deleted: true });
    } catch {
        return successResponse({ deleted: true });
    }
}
