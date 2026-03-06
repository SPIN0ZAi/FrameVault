// ─────────────────────────────────────────────────────────────────────────────
// achievement-defs.ts  — NO server imports, safe to use in client components
// ─────────────────────────────────────────────────────────────────────────────

export type AchievementId =
    | 'first_film' | 'century_club' | 'triple_century' | 'elite_viewer' | 'millennium'
    | 'first_review' | 'budding_critic' | 'film_critic' | 'master_critic'
    | 'first_rating' | 'opinionated' | 'taste_authority'
    | 'social_cinephile' | 'beloved' | 'icon'
    | 'curator' | 'archivist' | 'completionist'
    | 'early_adopter' | 'oscar_voter_2026';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'watching' | 'reviews' | 'ratings' | 'social' | 'collection' | 'special';

export interface AchievementDef {
    id: AchievementId;
    title: string;
    description: string;
    /** Lucide icon name */
    icon: string;
    color: string;
    gradient: string;
    category: AchievementCategory;
    rarity: AchievementRarity;
    rarityLabel: string;
}

export const RARITY_COLORS: Record<AchievementRarity, string> = {
    common: '#64748b',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b',
};

export const ACHIEVEMENTS: AchievementDef[] = [
    // ── Watching (5) ────────────────────────────────────────────────────────
    {
        id: 'first_film',
        title: 'First Film',
        description: 'Watch your very first movie',
        icon: 'Film',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
        category: 'watching',
        rarity: 'common',
        rarityLabel: 'Common',
    },
    {
        id: 'century_club',
        title: 'Century Club',
        description: 'Watch 100 movies',
        icon: 'Trophy',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        category: 'watching',
        rarity: 'rare',
        rarityLabel: 'Rare',
    },
    {
        id: 'triple_century',
        title: 'Triple Century',
        description: 'Watch 300 movies',
        icon: 'Shield',
        color: '#f97316',
        gradient: 'linear-gradient(135deg, #fb923c, #f97316)',
        category: 'watching',
        rarity: 'epic',
        rarityLabel: 'Epic',
    },
    {
        id: 'elite_viewer',
        title: 'Elite Viewer',
        description: 'Watch 500 movies',
        icon: 'Sparkles',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
        category: 'watching',
        rarity: 'epic',
        rarityLabel: 'Epic',
    },
    {
        id: 'millennium',
        title: 'Millennium',
        description: 'Watch 1,000 movies',
        icon: 'Crown',
        color: '#eab308',
        gradient: 'linear-gradient(135deg, #facc15, #eab308, #ca8a04)',
        category: 'watching',
        rarity: 'legendary',
        rarityLabel: 'Legendary',
    },

    // ── Reviews (4) ─────────────────────────────────────────────────────────
    {
        id: 'first_review',
        title: 'First Take',
        description: 'Write your very first review',
        icon: 'PenLine',
        color: '#14b8a6',
        gradient: 'linear-gradient(135deg, #2dd4bf, #14b8a6)',
        category: 'reviews',
        rarity: 'common',
        rarityLabel: 'Common',
    },
    {
        id: 'budding_critic',
        title: 'Budding Critic',
        description: 'Write 10 reviews',
        icon: 'BookOpen',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
        category: 'reviews',
        rarity: 'common',
        rarityLabel: 'Common',
    },
    {
        id: 'film_critic',
        title: 'Film Critic',
        description: 'Write 50 reviews',
        icon: 'BookMarked',
        color: '#6366f1',
        gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
        category: 'reviews',
        rarity: 'rare',
        rarityLabel: 'Rare',
    },
    {
        id: 'master_critic',
        title: 'Master Critic',
        description: 'Write 100 reviews',
        icon: 'Award',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
        category: 'reviews',
        rarity: 'epic',
        rarityLabel: 'Epic',
    },

    // ── Ratings (3) ─────────────────────────────────────────────────────────
    {
        id: 'first_rating',
        title: 'First Opinion',
        description: 'Rate your first movie',
        icon: 'Star',
        color: '#eab308',
        gradient: 'linear-gradient(135deg, #facc15, #eab308)',
        category: 'ratings',
        rarity: 'common',
        rarityLabel: 'Common',
    },
    {
        id: 'opinionated',
        title: 'Opinionated',
        description: 'Rate 50 movies',
        icon: 'BarChart3',
        color: '#f97316',
        gradient: 'linear-gradient(135deg, #fb923c, #f97316)',
        category: 'ratings',
        rarity: 'common',
        rarityLabel: 'Common',
    },
    {
        id: 'taste_authority',
        title: 'Taste Authority',
        description: 'Rate 200 movies',
        icon: 'Gem',
        color: '#a855f7',
        gradient: 'linear-gradient(135deg, #c084fc, #a855f7)',
        category: 'ratings',
        rarity: 'rare',
        rarityLabel: 'Rare',
    },

    // ── Social (3) ──────────────────────────────────────────────────────────
    {
        id: 'social_cinephile',
        title: 'Social Cinephile',
        description: 'Follow 10 users',
        icon: 'Users',
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
        category: 'social',
        rarity: 'common',
        rarityLabel: 'Common',
    },
    {
        id: 'beloved',
        title: 'Beloved',
        description: 'Reach 25 followers',
        icon: 'Heart',
        color: '#ec4899',
        gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
        category: 'social',
        rarity: 'rare',
        rarityLabel: 'Rare',
    },
    {
        id: 'icon',
        title: 'Icon',
        description: 'Reach 100 followers',
        icon: 'Flame',
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #f87171, #ef4444, #dc2626)',
        category: 'social',
        rarity: 'epic',
        rarityLabel: 'Epic',
    },

    // ── Collection (3) ──────────────────────────────────────────────────────
    {
        id: 'curator',
        title: 'Curator',
        description: 'Create 3 lists',
        icon: 'LayoutList',
        color: '#0ea5e9',
        gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
        category: 'collection',
        rarity: 'common',
        rarityLabel: 'Common',
    },
    {
        id: 'archivist',
        title: 'Archivist',
        description: 'Add 50 movies to your watchlist',
        icon: 'Archive',
        color: '#64748b',
        gradient: 'linear-gradient(135deg, #94a3b8, #64748b)',
        category: 'collection',
        rarity: 'rare',
        rarityLabel: 'Rare',
    },
    {
        id: 'completionist',
        title: 'Completionist',
        description: 'Like 25 reviews',
        icon: 'CheckCircle2',
        color: '#22c55e',
        gradient: 'linear-gradient(135deg, #4ade80, #22c55e)',
        category: 'collection',
        rarity: 'common',
        rarityLabel: 'Common',
    },

    // ── Special (2) ─────────────────────────────────────────────────────────
    {
        id: 'early_adopter',
        title: 'Pioneer',
        description: 'Joined FrameVault during its earliest days',
        icon: 'Sunrise',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #fde68a, #fbbf24, #f59e0b)',
        category: 'special',
        rarity: 'legendary',
        rarityLabel: 'Legendary',
    },
    {
        id: 'oscar_voter_2026',
        title: "Oscar Voter '26",
        description: 'Voted in the 98th Academy Awards Best Picture poll',
        icon: 'Clapperboard',
        color: '#d4af37',
        gradient: 'linear-gradient(135deg, #fde68a, #d4af37, #92400e)',
        category: 'special',
        rarity: 'rare',
        rarityLabel: 'Rare',
    },
];

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string }[] = [
    { id: 'watching', label: 'Watching' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'ratings', label: 'Ratings' },
    { id: 'social', label: 'Social' },
    { id: 'collection', label: 'Collection' },
    { id: 'special', label: 'Special' },
];
