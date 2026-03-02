import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const session = await auth();

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return notFoundError('User not found');

        const isOwner = session?.user?.id === user.id;

        const lists = await prisma.list.findMany({
            where: {
                userId: user.id,
                ...(isOwner ? {} : { isPublic: true }),
            },
            include: { _count: { select: { movies: true } } },
            orderBy: { updatedAt: 'desc' },
        });

        return successResponse(lists);
    } catch (error) {
        console.error('GET user lists error:', error);
        return serverError('Failed to fetch user lists');
    }
}
