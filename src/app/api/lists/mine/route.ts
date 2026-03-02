import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';

// GET /api/lists/mine — current user's own lists
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const lists = await prisma.list.findMany({
            where: { userId: session.user.id },
            include: { _count: { select: { movies: true } } },
            orderBy: { updatedAt: 'desc' },
        });

        return successResponse(lists);
    } catch (error) {
        console.error('GET /api/lists/mine error:', error);
        return serverError();
    }
}
