import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACHIEVEMENTS, checkAndAwardAchievements } from '@/lib/achievements';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';
import { auth } from '@/lib/auth';

// GET /api/users/[username]/achievements
// Returns all 20 achievement definitions + which ones this user has earned
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!user) return notFoundError('User');

        // If the requesting user IS this profile, run a check in case they qualify for new ones
        const session = await auth();
        if (session?.user?.id === user.id) {
            checkAndAwardAchievements(user.id).catch(() => null); // fire-and-forget
        }

        const earned = await prisma.userAchievement.findMany({
            where: { userId: user.id },
            select: { achievementId: true, earnedAt: true },
            orderBy: { earnedAt: 'asc' },
        });

        const earnedMap = Object.fromEntries(
            earned.map(e => [e.achievementId, { earnedAt: e.earnedAt.toISOString() }])
        );

        return successResponse({
            achievements: ACHIEVEMENTS.map(a => ({
                ...a,
                earned: earnedMap[a.id] ?? null,
            })),
            earnedCount: earned.length,
            totalCount: ACHIEVEMENTS.length,
        });
    } catch (error) {
        console.error('GET achievements error:', error);
        return serverError();
    }
}
