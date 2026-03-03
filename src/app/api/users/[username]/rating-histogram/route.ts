import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

// GET /api/users/[username]/rating-histogram — a user's personal rating distribution
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

        const ratings = await prisma.rating.findMany({
            where: { userId: user.id },
            select: { value: true },
        });

        const counts = new Array(10).fill(0);
        let sum = 0;
        for (const r of ratings) {
            const idx = Math.min(Math.max(r.value, 1), 10) - 1;
            counts[idx]++;
            sum += r.value;
        }

        const total = ratings.length;
        const average = total > 0 ? parseFloat((sum / total).toFixed(2)) : null;

        return successResponse({ counts, average, total });
    } catch (error) {
        console.error('GET /api/users/[username]/rating-histogram error:', error);
        return serverError();
    }
}
