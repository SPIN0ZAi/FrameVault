import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, notFoundError, forbiddenError, serverError } from '@/lib/api-response';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/lists/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();

        const list = await prisma.list.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
                movies: { orderBy: { position: 'asc' } },
            },
        });

        if (!list) return notFoundError('List');
        if (!list.isPublic && list.userId !== session?.user?.id) return forbiddenError();

        return successResponse(list);
    } catch (error) {
        console.error('GET /api/lists/[id] error:', error);
        return serverError();
    }
}

// PATCH /api/lists/[id] — update title / description / visibility
export async function PATCH(req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } });
        if (!list) return notFoundError('List');
        if (list.userId !== session.user.id) return forbiddenError();

        const { title, description, isPublic } = await req.json();

        const updated = await prisma.list.update({
            where: { id },
            data: {
                ...(title !== undefined && { title: title.trim().slice(0, 200) }),
                ...(description !== undefined && { description: description?.trim() || null }),
                ...(isPublic !== undefined && { isPublic }),
            },
        });

        return successResponse(updated);
    } catch (error) {
        console.error('PATCH /api/lists/[id] error:', error);
        return serverError();
    }
}

// DELETE /api/lists/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } });
        if (!list) return notFoundError('List');
        if (list.userId !== session.user.id) return forbiddenError();

        await prisma.list.delete({ where: { id } });
        return successResponse({ deleted: true });
    } catch (error) {
        console.error('DELETE /api/lists/[id] error:', error);
        return serverError();
    }
}
