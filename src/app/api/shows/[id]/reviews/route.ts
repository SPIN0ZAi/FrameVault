import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { reviewSchema } from '@/lib/validators';
import { successResponse, validationError, unauthorizedError, errorResponse, serverError } from '@/lib/api-response';
import { checkAndAwardAchievements } from '@/lib/achievements';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/shows/[id]/reviews — list reviews for a show
export async function GET(
    request: NextRequest,
    { params }: Ctx
) {
    try {
        const { id } = await params;
        const tmdbShowId = parseInt(id);
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));

        const session = await auth();

        const [reviews, totalCount] = await Promise.all([
            prisma.showReview.findMany({
                where: { tmdbShowId },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true, role: true } },
                    likes: session?.user ? { where: { userId: session.user.id } } : false,
                    _count: { select: { likes: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.showReview.count({ where: { tmdbShowId } }),
        ]);

        const formatted = reviews.map(r => ({
            id: r.id,
            content: r.content,
            containsSpoilers: r.containsSpoilers,
            createdAt: r.createdAt,
            user: r.user,
            likeCount: r._count.likes,
            likedByMe: session?.user ? (r.likes as { userId: string }[]).length > 0 : false,
        }));

        return successResponse(formatted, {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error('GET /api/shows/[id]/reviews error:', error);
        return serverError();
    }
}

// POST /api/shows/[id]/reviews — write a review for a show
export async function POST(
    request: NextRequest,
    { params }: Ctx
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { id } = await params;
        const tmdbShowId = parseInt(id);
        const body = await request.json();
        const result = reviewSchema.safeParse(body);

        if (!result.success) {
            return validationError(result.error.issues[0].message);
        }

        // Check if user already reviewed
        const existing = await prisma.showReview.findUnique({
            where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
        });

        if (existing) {
            return errorResponse(
                { code: 'ALREADY_REVIEWED', message: 'You have already reviewed this show. Edit your existing review instead.' },
                409
            );
        }

        const review = await prisma.showReview.create({
            data: {
                userId: session.user.id,
                tmdbShowId,
                content: result.data.content,
                containsSpoilers: result.data.containsSpoilers,
            },
            include: {
                user: { select: { id: true, username: true, avatarUrl: true, role: true } },
                _count: { select: { likes: true } },
            },
        });

        checkAndAwardAchievements(session.user.id).catch(() => null);

        return successResponse({
            id: review.id,
            content: review.content,
            containsSpoilers: review.containsSpoilers,
            createdAt: review.createdAt,
            user: review.user,
            likeCount: review._count.likes,
            likedByMe: false,
        });
    } catch (error) {
        console.error('POST /api/shows/[id]/reviews error:', error);
        return serverError();
    }
}
