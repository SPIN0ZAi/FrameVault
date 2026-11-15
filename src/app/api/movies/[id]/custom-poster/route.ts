import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, serverError, validationError } from '@/lib/api-response';
import { syncTMDBMovie } from '@/lib/sync-movie';

const ALLOWED_URL_ORIGINS = [
    'https://image.tmdb.org',
    process.env.NEXT_PUBLIC_SUPABASE_URL,
].filter(Boolean) as string[];

function isAllowedPosterUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        const normalizedUrl = url.replace(/\/+$/, '');
        return ALLOWED_URL_ORIGINS.some(origin => {
            const normalizedOrigin = origin.replace(/\/+$/, '');
            return normalizedUrl.startsWith(normalizedOrigin);
        });
    } catch {
        return false;
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { id } = await params;
        const { posterUrl } = await req.json();
        if (!posterUrl) return NextResponse.json({ success: false, error: { message: 'posterUrl is required' } }, { status: 400 });
        if (!isAllowedPosterUrl(posterUrl)) return validationError('Invalid poster URL: must be from a trusted source');

        // Ensure the movie exists locally using the lazy-save ID
        const internalMovieId = await syncTMDBMovie(id);

        await prisma.customPoster.upsert({
            where: {
                userId_movieId: {
                    userId: session.user.id,
                    movieId: internalMovieId,
                }
            },
            update: { posterUrl },
            create: {
                userId: session.user.id,
                movieId: internalMovieId,
                posterUrl,
            }
        });

        return successResponse({ updated: true, posterUrl });
    } catch (error) {
        console.error('Custom Poster Error:', error);
        return serverError('Failed to save custom poster');
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { id } = await params;
        const internalMovieId = await syncTMDBMovie(id);

        await prisma.customPoster.delete({
            where: {
                userId_movieId: {
                    userId: session.user.id,
                    movieId: internalMovieId,
                }
            }
        });

        return successResponse({ deleted: true });
    } catch (error) {
        // Ignore if error is 'Record to delete does not exist'
        return successResponse({ deleted: true });
    }
}
