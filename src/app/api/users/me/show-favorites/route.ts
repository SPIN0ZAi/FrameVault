import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, serverError } from '@/lib/api-response';

// GET /api/users/me/show-favorites
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const favorites = await prisma.userShowFavorite.findMany({
            where: { userId: session.user.id },
            orderBy: { position: 'asc' },
        });
        return successResponse(favorites);
    } catch {
        return serverError();
    }
}

// PUT /api/users/me/show-favorites — replace the full ordered list
// Body: [{ tmdbShowId, title, year?, posterUrl?, position }]
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const items: { tmdbShowId: number; title: string; year?: number; posterUrl?: string; position: number }[] =
            await req.json();

        if (!Array.isArray(items) || items.length > 5) {
            return serverError('Must supply between 0 and 5 favorites');
        }

        await prisma.$transaction(async (tx) => {
            await tx.userShowFavorite.deleteMany({ where: { userId: session.user.id } });
            if (items.length > 0) {
                await tx.userShowFavorite.createMany({
                    data: items.map((item, idx) => ({
                        userId: session.user.id,
                        tmdbShowId: item.tmdbShowId,
                        title: item.title,
                        year: item.year ?? null,
                        posterUrl: item.posterUrl ?? null,
                        position: item.position ?? idx,
                    })),
                });
            }
        });

        const updated = await prisma.userShowFavorite.findMany({
            where: { userId: session.user.id },
            orderBy: { position: 'asc' },
        });

        return successResponse(updated);
    } catch {
        return serverError();
    }
}
