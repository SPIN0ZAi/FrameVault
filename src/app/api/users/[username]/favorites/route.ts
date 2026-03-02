import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { successResponse, serverError } from '@/lib/api-response';

// GET /api/users/[username]/favorites — public
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return successResponse([]);

        const favorites = await prisma.userFavorite.findMany({
            where: { userId: user.id },
            orderBy: { position: 'asc' },
        });
        return successResponse(favorites);
    } catch {
        return serverError();
    }
}
