import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, serverError } from '@/lib/api-response';

// GET /api/movies/[id]/rating-histogram — site-wide rating distribution for a movie
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tmdbId = parseInt(id);
        if (isNaN(tmdbId)) return successResponse({ counts: new Array(10).fill(0), average: null, total: 0 });

        const localMovie = await prisma.movie.findUnique({
            where: { tmdbId },
            select: { id: true },
        });

        if (!localMovie) {
            return successResponse({ counts: new Array(10).fill(0), average: null, total: 0 });
        }

        const ratings = await prisma.rating.findMany({
            where: { movieId: localMovie.id },
            select: { value: true },
        });

        const counts = new Array(10).fill(0);
        let sum = 0;
        for (const r of ratings) {
            const idx = Math.min(Math.max(r.value, 1), 10) - 1;
            counts[idx]++;
            sum += r.value;
        }

        const total = ratings.length;
        const average = total > 0 ? parseFloat((sum / total).toFixed(2)) : null;

        return successResponse({ counts, average, total });
    } catch (error) {
        console.error('GET /api/movies/[id]/rating-histogram error:', error);
        return serverError();
    }
}
