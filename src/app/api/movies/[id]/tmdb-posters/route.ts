import { NextRequest } from 'next/server';
import { fetchFromTMDB, getTMDBImageUrl } from '@/lib/tmdb';
import { successResponse, serverError } from '@/lib/api-response';

interface TMDBImagesResponse {
    posters: { file_path: string; vote_average: number; width: number; height: number; iso_639_1: string | null }[];
}

// GET /api/movies/[id]/tmdb-posters — returns alternative poster images from TMDB
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Fetch both with and without language to get the most results
        const data = await fetchFromTMDB<TMDBImagesResponse>(`/movie/${id}/images`, {
            include_image_language: 'en,null',
        });

        // Sort by vote_average desc, deduplicate paths, take up to 24
        const seen = new Set<string>();
        const posters = data.posters
            .sort((a, b) => b.vote_average - a.vote_average)
            .filter(p => {
                if (seen.has(p.file_path)) return false;
                seen.add(p.file_path);
                return true;
            })
            .slice(0, 24)
            .map(p => ({
                thumb: getTMDBImageUrl(p.file_path, 'w342'),
                full: getTMDBImageUrl(p.file_path, 'original'),
            }));

        return successResponse(posters);
    } catch (error) {
        console.error('GET tmdb-posters error:', error);
        return serverError();
    }
}
