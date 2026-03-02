import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, unauthorizedError, notFoundError, serverError } from '@/lib/api-response';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { username } = await params;
        const currentUser = session.user;

        // Cannot follow yourself
        if (currentUser.username === username) {
            return NextResponse.json({ success: false, error: { message: "You cannot follow yourself" } }, { status: 400 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        if (!targetUser) return notFoundError('User');

        // Create the follow relationship
        await prisma.follows.upsert({
            where: {
                followerId_followingId: {
                    followerId: currentUser.id,
                    followingId: targetUser.id,
                }
            },
            update: {},
            create: {
                followerId: currentUser.id,
                followingId: targetUser.id,
            }
        });

        return successResponse({ following: true });
    } catch (error) {
        console.error('Follow User Error:', error);
        return serverError('Failed to follow user');
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return unauthorizedError();

        const { username } = await params;
        const currentUser = session.user;

        const targetUser = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        if (!targetUser) return notFoundError('User');

        await prisma.follows.delete({
            where: {
                followerId_followingId: {
                    followerId: currentUser.id,
                    followingId: targetUser.id,
                }
            }
        });

        return successResponse({ unfollowed: true });
    } catch (error: any) {
        // Prisma throws if record doesn't exist on delete
        if (error.code === 'P2025') {
            return successResponse({ unfollowed: true });
        }
        console.error('Unfollow User Error:', error);
        return serverError('Failed to unfollow user');
    }
}
