import { NextRequest, NextResponse } from 'next/server';
import { getPersonDetails, getPersonMovieCredits, getTMDBImageUrl } from '@/lib/tmdb';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Fetch actor details and credits from TMDB in parallel
        const [person, credits] = await Promise.all([
            getPersonDetails(id),
            getPersonMovieCredits(id),
        ]);

        // Sort by vote_count descending, take top 60 real movies
        const sorted = [...credits.cast]
            .filter(m => m.vote_count > 20 && m.release_date)
            .sort((a, b) => b.vote_count - a.vote_count)
            .slice(0, 60);

        // Enrich with local DB ratings where movies have been synced
        const tmdbIds = sorted.map(m => m.id);
        const localMovies = await prisma.movie.findMany({
            where: { tmdbId: { in: tmdbIds } },
            select: {
                id: true,
                tmdbId: true,
                ratings: { select: { value: true } },
            },
        });

        const localMap = new Map(localMovies.map(m => [m.tmdbId, m]));

        const movies = sorted.map(m => {
            const local = localMap.get(m.id);
            const avgRating = local?.ratings.length
                ? parseFloat((local.ratings.reduce((s, r) => s + r.value, 0) / local.ratings.length).toFixed(1))
                : null;
            return {
                id: m.id,
                title: m.title,
                character: m.character,
                year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
                posterUrl: getTMDBImageUrl(m.poster_path, 'w342'),
                averageRating: avgRating,
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                id: person.id,
                name: person.name,
                biography: person.biography,
                birthday: person.birthday,
                deathday: person.deathday,
                placeOfBirth: person.place_of_birth,
                photoUrl: getTMDBImageUrl(person.profile_path, 'w342'),
                department: person.known_for_department,
                movies,
            },
        });
    } catch (e) {
        console.error('[actors/[id]] error:', e);
        return NextResponse.json({ success: false, error: 'Failed to load actor' }, { status: 500 });
    }
}
