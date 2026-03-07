import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

// GET /api/users/[username]/shows
// Params: page, limit, sort (date_desc|date_asc|title_asc|title_desc)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { searchParams } = new URL(request.url);
        const page  = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(200, parseInt(searchParams.get('limit') || '20'));
        const sort  = searchParams.get('sort') || 'date_desc';

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });
        if (!user) return notFoundError('User');

        const orderBy =
            sort === 'date_asc'   ? { watchedAt: 'asc' as const } :
            sort === 'title_asc'  ? { title: 'asc' as const } :
            sort === 'title_desc' ? { title: 'desc' as const } :
            { watchedAt: 'desc' as const };

        const [shows, totalCount] = await Promise.all([
            prisma.watchedShow.findMany({
                where: { userId: user.id },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.watchedShow.count({ where: { userId: user.id } }),
        ]);

        return successResponse(shows, {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error('GET user shows error:', error);
        return serverError();
    }
}
