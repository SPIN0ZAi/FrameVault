import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndAwardAchievements } from '@/lib/achievements';

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ reviewId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });

    const { reviewId } = await params;
    try {
        await prisma.reviewLike.create({
            data: { userId: session.user.id, reviewId },
        });
        const count = await prisma.reviewLike.count({ where: { reviewId } });
        checkAndAwardAchievements(session.user.id).catch(() => null);
        return NextResponse.json({ success: true, data: { likeCount: count, likedByMe: true } });
    } catch {
        // Already liked — ignore unique constraint violation
        const count = await prisma.reviewLike.count({ where: { reviewId } });
        return NextResponse.json({ success: true, data: { likeCount: count, likedByMe: true } });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ reviewId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });

    const { reviewId } = await params;
    await prisma.reviewLike.deleteMany({
        where: { userId: session.user.id, reviewId },
    });
    const count = await prisma.reviewLike.count({ where: { reviewId } });
    return NextResponse.json({ success: true, data: { likeCount: count, likedByMe: false } });
}
