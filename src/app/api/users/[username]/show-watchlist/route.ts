import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

// GET /api/users/[username]/show-watchlist
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { searchParams } = new URL(request.url);
        const limit = Math.min(200, parseInt(searchParams.get('limit') || '100'));

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });
        if (!user) return notFoundError('User');

        const items = await prisma.showWatchlistItem.findMany({
            where: { userId: user.id },
            orderBy: { addedAt: 'desc' },
            take: limit,
        });

        return successResponse(items);
    } catch (error) {
        console.error('GET user show-watchlist error:', error);
        return serverError();
    }
}
