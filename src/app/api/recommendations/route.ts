import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchFromTMDB, getTMDBImageUrl, isAdultContent } from '@/lib/tmdb';

interface TMDBRecMovie {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    overview: string;
    adult?: boolean;
}

interface TMDBRecResponse {
    results: TMDBRecMovie[];
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get user's top-rated movies (rating >= 7/10), ordered by rating desc
        const topRatings = await prisma.rating.findMany({
            where: { userId, value: { gte: 7 } },
            orderBy: { value: 'desc' },
            take: 5,
            include: {
                movie: { select: { tmdbId: true, title: true } },
            },
        });

        if (topRatings.length === 0) {
            // User has no high ratings yet — fall back to their watched movies
            const watched = await prisma.watchedMovie.findMany({
                where: { userId },
                orderBy: { watchedAt: 'desc' },
                take: 5,
                include: { movie: { select: { tmdbId: true, title: true } } },
            });
            if (watched.length === 0) {
                return NextResponse.json({ success: true, data: [] });
            }
            // Use watched as source
            topRatings.push(
                ...watched.map(w => ({ movie: w.movie, value: 0 })) as typeof topRatings
            );
        }

        // Collect IDs of movies the user has already rated or watched (to exclude from recs)
        const [allRatedIds, allWatchedIds] = await Promise.all([
            prisma.rating.findMany({ where: { userId }, select: { movie: { select: { tmdbId: true } } } }),
            prisma.watchedMovie.findMany({ where: { userId }, select: { movie: { select: { tmdbId: true } } } }),
        ]);
        const seenTmdbIds = new Set<number>([
            ...allRatedIds.map(r => r.movie.tmdbId).filter(Boolean) as number[],
            ...allWatchedIds.map(w => w.movie.tmdbId).filter(Boolean) as number[],
        ]);

        // Fetch TMDB recommendations for each source movie (parallel)
        const sources = topRatings
            .filter(r => r.movie.tmdbId)
            .slice(0, 4); // max 4 sources

        const recResults = await Promise.allSettled(
            sources.map(r =>
                fetchFromTMDB<TMDBRecResponse>(`/movie/${r.movie.tmdbId}/recommendations`, {
                    page: '1',
                })
                    .then(data => ({ title: r.movie.title, results: data.results }))
            )
        );

        // Merge all results — deduplicate and filter
        const seen = new Set<number>();
        const merged: Array<{ id: number; title: string; year: number; posterUrl: string | null; rating: number | null; basedOn: string }> = [];

        for (const result of recResults) {
            if (result.status !== 'fulfilled') continue;
            const { title: basedOn, results } = result.value;

            for (const m of results) {
                if (seen.has(m.id)) continue;
                if (seenTmdbIds.has(m.id)) continue; // already seen by user
                if (isAdultContent(m)) continue;
                if (m.vote_count < 50) continue; // skip obscure

                seen.add(m.id);
                merged.push({
                    id: m.id,
                    title: m.title,
                    year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : 0,
                    posterUrl: getTMDBImageUrl(m.poster_path, 'w342'),
                    rating: m.vote_average ? parseFloat(m.vote_average.toFixed(1)) : null,
                    basedOn,
                });
            }
        }

        // Shuffle slightly then take 24
        const shuffled = merged.sort(() => Math.random() - 0.3).slice(0, 24);

        return NextResponse.json({ success: true, data: shuffled });
    } catch (e) {
        console.error('[recommendations] error:', e);
        return NextResponse.json({ success: false, error: 'Failed to load recommendations' }, { status: 500 });
    }
}
