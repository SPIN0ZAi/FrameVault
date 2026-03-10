import { NextRequest } from 'next/server';
import { discoverMovies, isAdultContent, getTMDBImageUrl } from '@/lib/tmdb';
import { successResponse, errorResponse, serverError } from '@/lib/api-response';

// Maps mood slugs → TMDB genre IDs (pipe = OR so we get wider results)
const MOOD_MAP: Record<string, { genres: string; label: string; sort?: string }> = {
    'feel-good':    { genres: '35|10751',      label: 'Feel Good' },
    'thrilling':    { genres: '53|80',         label: 'Thrilling' },
    'scary':        { genres: '27',            label: 'Scary',       sort: 'top_rated' },
    'romantic':     { genres: '10749',         label: 'Romantic' },
    'adventurous':  { genres: '12|28',         label: 'Adventurous' },
    'inspired':     { genres: '18|36',         label: 'Inspired',    sort: 'top_rated' },
    'mind-bending': { genres: '878|9648',      label: 'Mind-Bending' },
    'nostalgic':    { genres: '16|10751',      label: 'Nostalgic' },
    'epic':         { genres: '10752|36|14',   label: 'Epic',        sort: 'top_rated' },
    'chill':        { genres: '99|10402',      label: 'Chill' },
};

// GET /api/movies/mood?mood=<slug>
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const moodSlug = searchParams.get('mood') ?? '';
        const mood = MOOD_MAP[moodSlug];

        if (!mood) {
            return errorResponse({ code: 'BAD_REQUEST', message: 'Invalid or missing mood' }, 400);
        }

        // Randomise the page so repeat clicks give fresh results
        const randomPage = Math.floor(Math.random() * 8) + 1;

        const data = await discoverMovies({
            page: randomPage,
            genre: mood.genres,
            sort: mood.sort ?? 'popular',
        });

        const movies = data.results
            .filter(m => !isAdultContent(m) && m.poster_path && m.overview && m.overview.length > 20)
            .slice(0, 12)
            .map(m => ({
                id: m.id,
                title: m.title,
                year: m.release_date ? parseInt(m.release_date.substring(0, 4), 10) : 0,
                posterUrl: getTMDBImageUrl(m.poster_path, 'w500'),
                voteAverage: m.vote_average ?? 0,
                overview: m.overview,
            }));

        return successResponse({ mood: moodSlug, label: mood.label, movies });
    } catch (err) {
        console.error('[mood] error:', err);
        return serverError();
    }
}
