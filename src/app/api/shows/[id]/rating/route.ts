import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ratingSchema } from '@/lib/validators';
import { successResponse, validationError, unauthorizedError, serverError } from '@/lib/api-response';

// POST /api/shows/[id]/rating — upsert rating
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { id } = await params;
        const tmdbShowId = parseInt(id);
        if (isNaN(tmdbShowId)) return validationError('Invalid show ID');

        const body = await request.json();
        const result = ratingSchema.safeParse(body);
        if (!result.success) return validationError(result.error.issues[0].message);

        const rating = await prisma.showRating.upsert({
            where: { userId_tmdbShowId: { userId: session.user.id, tmdbShowId } },
            create: { userId: session.user.id, tmdbShowId, value: result.data.value },
            update: { value: result.data.value },
        });

        return successResponse(rating);
    } catch (error) {
        console.error('POST show rating error:', error);
        return serverError();
    }
}

// DELETE /api/shows/[id]/rating — remove rating
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return unauthorizedError();

        const { id } = await params;
        const tmdbShowId = parseInt(id);

        await prisma.showRating.deleteMany({
            where: { userId: session.user.id, tmdbShowId },
        });

        return successResponse({ removed: true });
    } catch (error) {
        console.error('DELETE show rating error:', error);
        return serverError();
    }
}
