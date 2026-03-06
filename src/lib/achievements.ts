// Server-only  imports prisma. Never import this from client components.
// For types/constants in client components, import from './achievement-defs' instead.
import { prisma } from './prisma';

export type { AchievementId, AchievementRarity, AchievementCategory, AchievementDef } from './achievement-defs';
export { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, RARITY_COLORS } from './achievement-defs';

//  Early-adopter cutoff 

const EARLY_ADOPTER_CUTOFF = new Date('2026-04-01T00:00:00Z');

//  Core function: check & award 

export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
    try {
        const [
            watchedCount,
            reviewCount,
            ratingCount,
            followingCount,
            followersCount,
            listCount,
            watchlistCount,
            reviewLikesGiven,
            user,
            earnedRaw,
            oscarVote,
        ] = await Promise.all([
            prisma.watchedMovie.count({ where: { userId } }),
            prisma.review.count({ where: { userId } }),
            prisma.rating.count({ where: { userId } }),
            prisma.follows.count({ where: { followerId: userId } }),
            prisma.follows.count({ where: { followingId: userId } }),
            prisma.list.count({ where: { userId } }),
            prisma.watchlistItem.count({ where: { userId } }),
            prisma.reviewLike.count({ where: { userId } }),
            prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
            prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
            prisma.oscarVote.findFirst({ where: { userId } }),
        ]);

        const earned = new Set(earnedRaw.map((a: { achievementId: string }) => a.achievementId));
        const toAward: string[] = [];

        const check = (id: string, condition: boolean) => {
            if (condition && !earned.has(id)) toAward.push(id);
        };

        check('first_film', watchedCount >= 1);
        check('century_club', watchedCount >= 100);
        check('triple_century', watchedCount >= 300);
        check('elite_viewer', watchedCount >= 500);
        check('millennium', watchedCount >= 1000);

        check('first_review', reviewCount >= 1);
        check('budding_critic', reviewCount >= 10);
        check('film_critic', reviewCount >= 50);
        check('master_critic', reviewCount >= 100);

        check('first_rating', ratingCount >= 1);
        check('opinionated', ratingCount >= 50);
        check('taste_authority', ratingCount >= 200);

        check('social_cinephile', followingCount >= 10);
        check('beloved', followersCount >= 25);
        check('icon', followersCount >= 100);

        check('curator', listCount >= 3);
        check('archivist', watchlistCount >= 50);
        check('completionist', reviewLikesGiven >= 25);

        if (user) {
            check('early_adopter', user.createdAt < EARLY_ADOPTER_CUTOFF);
        }
        check('oscar_voter_2026', !!oscarVote);

        if (toAward.length > 0) {
            await prisma.userAchievement.createMany({
                data: toAward.map(achievementId => ({ userId, achievementId })),
                skipDuplicates: true,
            });
        }

        return toAward;
    } catch (e) {
        console.error('[achievements] checkAndAwardAchievements error:', e);
        return [];
    }
}
