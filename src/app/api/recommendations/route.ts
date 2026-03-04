import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchFromTMDB, getTMDBImageUrl, isAdultContent } from '@/lib/tmdb';

interface TMDBMovie {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    overview: string;
    genre_ids?: number[];
    adult?: boolean;
}

interface TMDBMovieDetail {
    id: number;
    genres: { id: number; name: string }[];
}

interface TMDBDiscoverResponse {
    results: TMDBMovie[];
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
        }

        const userId = session.user.id;

        // ── Step 1: get user's rated movies (any rating) to understand taste ──
        const allRatings = await prisma.rating.findMany({
            where: { userId },
            orderBy: { value: 'desc' },
            include: { movie: { select: { tmdbId: true, title: true } } },
        });

        // Also collect watched (to exclude from results)
        const allWatched = await prisma.watchedMovie.findMany({
            where: { userId },
            select: { movie: { select: { tmdbId: true } } },
        });

        const seenTmdbIds = new Set<number>([
            ...allRatings.map(r => r.movie.tmdbId).filter(Boolean) as number[],
            ...allWatched.map(w => w.movie.tmdbId).filter(Boolean) as number[],
        ]);

        // High-rated movies (≥7) are the taste signal sources
        const highRated = allRatings.filter(r => r.value >= 7 && r.movie.tmdbId);

        if (highRated.length === 0) {
            // Not enough signal yet
            return NextResponse.json({ success: true, data: [] });
        }

        // ── Step 2: fetch TMDB genre list for each high-rated movie ──
        // Take top 6 by rating (already sorted desc)
        const sources = highRated.slice(0, 6);

        const genreResults = await Promise.allSettled(
            sources.map(r =>
                fetchFromTMDB<TMDBMovieDetail>(`/movie/${r.movie.tmdbId}`)
                    .then(d => ({ rating: r.value, genres: d.genres.map(g => g.id), title: r.movie.title }))
            )
        );

        // ── Step 3: build a weighted genre score ──
        // Each genre gets (rating / 10) points per movie it appears in
        const genreScore: Record<number, number> = {};
        const genreSources: Record<number, string[]> = {}; // genre → source titles

        for (const res of genreResults) {
            if (res.status !== 'fulfilled') continue;
            const { rating, genres, title } = res.value;
            for (const gid of genres) {
                genreScore[gid] = (genreScore[gid] ?? 0) + rating;
                if (!genreSources[gid]) genreSources[gid] = [];
                if (!genreSources[gid].includes(title)) genreSources[gid].push(title);
            }
        }

        if (Object.keys(genreScore).length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Pick top 3 genres by score
        const topGenres = Object.entries(genreScore)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id]) => parseInt(id));

        // Build "based on" label from the top genre's source movies
        const topGenreId = topGenres[0];
        const basedOnTitles = (genreSources[topGenreId] ?? []).slice(0, 2);
        const basedOnLabel = basedOnTitles.join(', ');

        // ── Step 4: discover movies for each top genre ──
        // Fetch pages in parallel for top 3 genres
        const discoverResults = await Promise.allSettled(
            topGenres.map(gid =>
                fetchFromTMDB<TMDBDiscoverResponse>('/discover/movie', {
                    with_genres: gid.toString(),
                    sort_by: 'vote_average.desc',
                    'vote_count.gte': '500',       // quality filter — only well-known films
                    'vote_average.gte': '6.5',     // min quality threshold
                    include_adult: 'false',
                    page: String(Math.ceil(Math.random() * 3)), // some variety each load
                }).then(d => ({ gid, results: d.results }))
            )
        );

        // ── Step 5: merge, deduplicate, filter ──
        const seen = new Set<number>();
        const merged: Array<{
            id: number; title: string; year: number;
            posterUrl: string | null; rating: number | null; basedOn: string;
        }> = [];

        for (const res of discoverResults) {
            if (res.status !== 'fulfilled') continue;
            const { results } = res.value;

            for (const m of results) {
                if (seen.has(m.id)) continue;
                if (seenTmdbIds.has(m.id)) continue;   // user already seen it
                if (isAdultContent(m)) continue;
                if ((m.vote_count ?? 0) < 500) continue;

                seen.add(m.id);
                merged.push({
                    id: m.id,
                    title: m.title,
                    year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : 0,
                    posterUrl: getTMDBImageUrl(m.poster_path, 'w342'),
                    rating: m.vote_average ? parseFloat(m.vote_average.toFixed(1)) : null,
                    basedOn: basedOnLabel,
                });
            }
        }

        // Shuffle for variety and cap at 24
        const shuffled = merged
            .sort(() => Math.random() - 0.5)
            .slice(0, 24);

        return NextResponse.json({ success: true, data: shuffled });
    } catch (e) {
        console.error('[recommendations] error:', e);
        return NextResponse.json({ success: false, error: 'Failed to load recommendations' }, { status: 500 });
    }
}
