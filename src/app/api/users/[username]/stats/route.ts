import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// GET /api/users/[username]/stats — activity stats for a user
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!user) return notFoundError('User not found');

        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const oneYearAgo     = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

        // ── Monthly watches (last 12 months, movies only) ──────────────────
        const recentMovies = await prisma.watchedMovie.findMany({
            where: { userId: user.id, watchedAt: { gte: twelveMonthsAgo } },
            select: { watchedAt: true },
        });

        // Build 12-slot map keyed "YYYY-MM" initialised to 0
        const monthMap = new Map<string, number>();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthMap.set(
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                0
            );
        }
        for (const wm of recentMovies) {
            const d   = wm.watchedAt;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
        }

        const monthlyWatches = Array.from(monthMap.entries()).map(([key, count]) => {
            const [year, month] = key.split('-').map(Number);
            return { month: MONTH_LABELS[month - 1], year, count };
        });

        // ── Genre breakdown (all-time, top 8) ────────────────────────────
        const genreRaw = await prisma.$queryRaw<{ genre: string; count: bigint }[]>`
            SELECT g.name AS genre, COUNT(*) AS count
            FROM movie_genres mg
            JOIN genres g ON g.id = mg."genreId"
            JOIN movies m  ON m.id = mg."movieId"
            JOIN watched_movies wm ON wm."movieId" = m.id
            WHERE wm."userId" = ${user.id}
            GROUP BY g.name
            ORDER BY count DESC
            LIMIT 8
        `;

        const genreBreakdown = genreRaw.map(row => ({
            genre: row.genre,
            count: Number(row.count),
        }));

        // ── Activity heatmap: all watch dates in the past year (movies + shows) ─
        const [heatmapMovies, heatmapShows] = await Promise.all([
            prisma.watchedMovie.findMany({
                where: { userId: user.id, watchedAt: { gte: oneYearAgo } },
                select: { watchedAt: true, movie: { select: { id: true, title: true, tmdbId: true } } },
            }),
            prisma.watchedShow.findMany({
                where: { userId: user.id, watchedAt: { gte: oneYearAgo } },
                select: { watchedAt: true, tmdbShowId: true, title: true },
            }),
        ]);

        type HeatItem  = { title: string; href: string; type: 'movie' | 'show' };
        type HeatEntry = { count: number; items: HeatItem[] };
        const dateMap = new Map<string, HeatEntry>();
        for (const wm of heatmapMovies) {
            const d   = wm.watchedAt;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const entry = dateMap.get(key) ?? { count: 0, items: [] };
            entry.count++;
            entry.items.push({ title: wm.movie.title, href: `/movies/${wm.movie.tmdbId ?? wm.movie.id}`, type: 'movie' });
            dateMap.set(key, entry);
        }
        for (const ws of heatmapShows) {
            const d   = ws.watchedAt;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const entry = dateMap.get(key) ?? { count: 0, items: [] };
            entry.count++;
            entry.items.push({ title: ws.title, href: `/shows/${ws.tmdbShowId}`, type: 'show' });
            dateMap.set(key, entry);
        }
        const heatmap = Array.from(dateMap.entries())
            .map(([date, data]) => ({ date, count: data.count, items: data.items }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // ── Summary totals ─────────────────────────────────────────────────
        const [totalWatched, totalShows, totalRatings, totalReviews, ratingAgg] = await Promise.all([
            prisma.watchedMovie.count({ where: { userId: user.id } }),
            prisma.watchedShow.count({ where: { userId: user.id } }),
            prisma.rating.count({ where: { userId: user.id } }),
            prisma.review.count({ where: { userId: user.id } }),
            prisma.rating.aggregate({ where: { userId: user.id }, _avg: { value: true } }),
        ]);

        return successResponse({
            monthlyWatches,
            genreBreakdown,
            heatmap,
            summary: {
                totalWatched,
                totalShows,
                totalRatings,
                totalReviews,
                avgRating: ratingAgg._avg.value != null
                    ? parseFloat(ratingAgg._avg.value.toFixed(2))
                    : null,
            },
        });
    } catch (error) {
        console.error('GET /api/users/[username]/stats error:', error);
        return serverError();
    }
}
