import { NextRequest } from 'next/server';
import { successResponse, serverError } from '@/lib/api-response';
import { getShowDetails } from '@/lib/tmdb';


const cache = new Map<string, { data: any; expires: number }>();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const tmdbShowId = parseInt(params.id);
    if (isNaN(tmdbShowId)) {
        return serverError('Invalid show ID');
    }

    const cacheKey = `show-preview-${tmdbShowId}`;
    const now = Date.now();

    // Check cache (5 min TTL)
    const cached = cache.get(cacheKey);
    if (cached && now < cached.expires) {
        return successResponse(cached.data);
    }

    try {
        const show = await getShowDetails(tmdbShowId);

        if (!show) {
            return serverError('Show not found');
        }

        const data = {
            backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/w780${show.backdrop_path}` : null,
            description: show.overview,
            cast: show.credits?.cast?.slice(0, 3).map((c: any) => ({
                name: c.name,
                character: c.character,
            })) || [],
        };

        cache.set(cacheKey, { data, expires: now + 5 * 60 * 1000 });
        return successResponse(data);
    } catch {
        return serverError('Failed to fetch show preview');
    }
}
