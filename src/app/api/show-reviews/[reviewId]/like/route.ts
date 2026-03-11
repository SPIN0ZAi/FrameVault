import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ reviewId: string }> };

export async function POST(
    _req: NextRequest,
    { params }: Ctx
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });

    const { reviewId } = await params;
    try {
        await prisma.showReviewLike.create({
            data: { userId: session.user.id, reviewId },
        });
        const count = await prisma.showReviewLike.count({ where: { reviewId } });
        return NextResponse.json({ success: true, data: { likeCount: count, likedByMe: true } });
    } catch {
        // Already liked — ignore unique constraint violation
        const count = await prisma.showReviewLike.count({ where: { reviewId } });
        return NextResponse.json({ success: true, data: { likeCount: count, likedByMe: true } });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: Ctx
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });

    const { reviewId } = await params;
    await prisma.showReviewLike.deleteMany({
        where: { userId: session.user.id, reviewId },
    });
    const count = await prisma.showReviewLike.count({ where: { reviewId } });
    return NextResponse.json({ success: true, data: { likeCount: count, likedByMe: false } });
}
