import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, notFoundError, serverError } from '@/lib/api-response';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/lists/[id]/like
export async function POST(_req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const list = await prisma.list.findUnique({ where: { id }, select: { id: true, isPublic: true } });
        if (!list) return notFoundError('List');

        await prisma.listLike.upsert({
            where: { userId_listId: { userId: session.user.id, listId: id } },
            update: {},
            create: { id: `ll_${Date.now()}_${Math.random().toString(36).slice(2)}`, userId: session.user.id, listId: id },
        });

        const likeCount = await prisma.listLike.count({ where: { listId: id } });
        return successResponse({ liked: true, likeCount });
    } catch (error) {
        console.error('POST /api/lists/[id]/like error:', error);
        return serverError();
    }
}

// DELETE /api/lists/[id]/like
export async function DELETE(_req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        await prisma.listLike.deleteMany({
            where: { userId: session.user.id, listId: id },
        });

        const likeCount = await prisma.listLike.count({ where: { listId: id } });
        return successResponse({ liked: false, likeCount });
    } catch (error) {
        console.error('DELETE /api/lists/[id]/like error:', error);
        return serverError();
    }
}
