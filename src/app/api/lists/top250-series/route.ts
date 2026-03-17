import { successResponse, serverError } from '@/lib/api-response';
import { getTopRatedShows, getTMDBImageUrl } from '@/lib/tmdb';

// GET /api/lists/top250-series — fetch TMDB top-rated TV shows (250 total)
export async function GET() {
    try {
        // 250 shows = 13 pages of 20
        const pages = Array.from({ length: 13 }, (_, i) => i + 1);
        const results = await Promise.all(pages.map((p) => getTopRatedShows(p)));

        const seen = new Set<number>();
        const shows = results
            .flatMap((r) => r.results)
            .filter((s) => {
                if (seen.has(s.id)) return false;
                seen.add(s.id);
                return true;
            })
            .slice(0, 250)
            .map((s, i) => ({
                rank: i + 1,
                id: s.id,
                title: s.name,
                year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : 0,
                posterUrl: getTMDBImageUrl(s.poster_path, 'w342'),
                rating: s.vote_average ? parseFloat((s.vote_average / 2).toFixed(1)) : null,
            }));

        return successResponse(shows);
    } catch (error) {
        console.error('GET /api/lists/top250-series error:', error);
        return serverError();
    }
}
