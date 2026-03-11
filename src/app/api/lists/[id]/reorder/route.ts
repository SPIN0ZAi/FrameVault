import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, notFoundError, forbiddenError, serverError } from '@/lib/api-response';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/lists/[id]/reorder
// Body: { items: [{ id: string, position: number, groupLabel?: string }] }
export async function POST(req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } });
        if (!list) return notFoundError('List');
        if (list.userId !== session.user.id) return forbiddenError();

        const { items } = await req.json() as {
            items: { id: string; position: number; groupLabel?: string | null }[]
        };

        if (!Array.isArray(items)) return serverError('items must be an array');

        // Batch update positions and groupLabels
        await Promise.all(
            items.map((item) =>
                prisma.listMovie.update({
                    where: { id: item.id },
                    data: {
                        position: item.position,
                        ...(item.groupLabel !== undefined && { groupLabel: item.groupLabel || null }),
                    },
                })
            )
        );

        return successResponse({ reordered: true });
    } catch (error) {
        console.error('POST /api/lists/[id]/reorder error:', error);
        return serverError();
    }
}
