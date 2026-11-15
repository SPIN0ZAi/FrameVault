import { ThemeDefinition } from './types';

export const THEMES: ThemeDefinition[] = [
    // ════════════════════════════════════════════════════════════════
    // DEFAULT
    // ════════════════════════════════════════════════════════════════
    {
        id: 'default',
        name: 'FrameVault Classic',
        subtitle: 'The original cinematic vault',
        category: 'default',
        description: 'Clean charcoal and neon teal aesthetic engineered for distraction-free movie and TV curation.',
        tagline: 'Precision Film Curation',
        icon: '🎬',
        colors: {
            brand: '#00D1C1',
            brandLight: '#33EAD4',
            brandDark: '#00A69A',
            bgPrimary: '#1A1D21',
            bgSecondary: '#2C3136',
            bgTertiary: 'rgba(44, 49, 54, 0.45)',
            bgElevated: '#24292e',
            textPrimary: '#FFFFFF',
            textSecondary: 'rgba(255, 255, 255, 0.72)',
            textTertiary: 'rgba(255, 255, 255, 0.42)',
            borderDefault: 'rgba(255, 255, 255, 0.08)',
            borderSubtle: 'rgba(255, 255, 255, 0.04)',
            borderStrong: 'rgba(0, 209, 193, 0.35)',
            accentGlow: 'rgba(0, 209, 193, 0.22)',
        },
        ambientEffect: 'none',
        logoVariant: 'default',
    },

    // ════════════════════════════════════════════════════════════════
    // 1. SEASONAL & HOLIDAYS
    // ════════════════════════════════════════════════════════════════
    {
        id: 'christmas',
        name: 'Winter Wonderland',
        subtitle: 'Christmas & Holiday Season',
        category: 'seasonal',
        description: 'Festive frosted pines, warm candlelight, Christmas string lights, and gentle falling snow across the screen.',
        tagline: 'Warm Fires & Falling Snow',
        icon: '🎄',
        badge: 'Holiday Special',
        colors: {
            brand: '#E02424', // Festive Crimson
            brandLight: '#F87171',
            brandDark: '#991B1B',
            bgPrimary: '#0C1713', // Deep evergreen forest night
            bgSecondary: '#162822',
            bgTertiary: 'rgba(22, 40, 34, 0.55)',
            bgElevated: '#1D352D',
            textPrimary: '#F8FAFC',
            textSecondary: '#CBD5E1',
            textTertiary: '#94A3B8',
            borderDefault: 'rgba(224, 36, 36, 0.18)',
            borderSubtle: 'rgba(255, 255, 255, 0.06)',
            borderStrong: 'rgba(250, 204, 21, 0.45)', // Warm gold accents
            accentGlow: 'rgba(224, 36, 36, 0.35)',
        },
        ambientEffect: 'snow',
        logoVariant: 'christmas',
        headerGlow: 'linear-gradient(90deg, rgba(224,36,36,0.15) 0%, rgba(34,197,94,0.15) 100%)',
    },
    {
        id: 'halloween',
        name: 'Spooky All Hallows',
        subtitle: 'Halloween Nocturne',
        category: 'seasonal',
        description: 'Creeping graveyard fog, sinister carved pumpkins, haunted violet shadows, and glowing jack-o-lantern eyes.',
        tagline: 'When Shadows Walk the Earth',
        icon: '🎃',
        badge: 'Spooky Season',
        colors: {
            brand: '#FF6B00', // Toxic Pumpkin Orange
            brandLight: '#FFA149',
            brandDark: '#C74A00',
            bgPrimary: '#0A0612', // Haunted Obsidian Purple
            bgSecondary: '#160E24',
            bgTertiary: 'rgba(22, 14, 36, 0.55)',
            bgElevated: '#211637',
            textPrimary: '#FDF4FF',
            textSecondary: '#D8B4FE',
            textTertiary: '#A855F7',
            borderDefault: 'rgba(255, 107, 0, 0.22)',
            borderSubtle: 'rgba(168, 85, 247, 0.12)',
            borderStrong: 'rgba(255, 107, 0, 0.55)',
            accentGlow: 'rgba(255, 107, 0, 0.35)',
        },
        ambientEffect: 'halloween-fog',
        logoVariant: 'halloween',
        headerGlow: 'linear-gradient(90deg, rgba(255,107,0,0.18) 0%, rgba(168,85,247,0.18) 100%)',
    },
    {
        id: 'thanksgiving',
        name: 'Autumn Harvest',
        subtitle: 'Thanksgiving & Golden Fall',
        category: 'seasonal',
        description: 'Cozy timber fires, golden amber hues, russet red leaves tumbling in the wind, and warm harvest elegance.',
        tagline: 'Warmth, Gratitude & Golden Leaves',
        icon: '🍂',
        badge: 'Autumn Special',
        colors: {
            brand: '#D97706', // Harvest Amber
            brandLight: '#FBBF24',
            brandDark: '#92400E',
            bgPrimary: '#140E0A', // Deep Roasted Cedar
            bgSecondary: '#241912',
            bgTertiary: 'rgba(36, 25, 18, 0.55)',
            bgElevated: '#332319',
            textPrimary: '#FEF3C7',
            textSecondary: '#FDE68A',
            textTertiary: '#B45309',
            borderDefault: 'rgba(217, 119, 6, 0.22)',
            borderSubtle: 'rgba(254, 243, 199, 0.08)',
            borderStrong: 'rgba(251, 191, 36, 0.45)',
            accentGlow: 'rgba(217, 119, 6, 0.32)',
        },
        ambientEffect: 'autumn-leaves',
        logoVariant: 'thanksgiving',
    },

    // ════════════════════════════════════════════════════════════════
    // 2. MOVIE GENRE THEMES
    // ════════════════════════════════════════════════════════════════
    {
        id: 'scifi',
        name: 'Galactic Horizon',
        subtitle: 'Science Fiction & Space Exploration',
        category: 'genre',
        description: 'Holographic cyan displays, orbital telemetry, digital coordinates, and starry void vistas.',
        tagline: 'Beyond the Known Universe',
        icon: '🚀',
        colors: {
            brand: '#06B6D4', // Hologram Cyan
            brandLight: '#67E8F9',
            brandDark: '#0891B2',
            bgPrimary: '#050B14', // Deep Starfield
            bgSecondary: '#0B1726',
            bgTertiary: 'rgba(11, 23, 38, 0.55)',
            bgElevated: '#12233A',
            textPrimary: '#E0F2FE',
            textSecondary: '#7DD3FC',
            textTertiary: '#38BDF8',
            borderDefault: 'rgba(6, 182, 212, 0.24)',
            borderSubtle: 'rgba(6, 182, 212, 0.08)',
            borderStrong: 'rgba(6, 182, 212, 0.65)',
            accentGlow: 'rgba(6, 182, 212, 0.4)',
        },
        ambientEffect: 'radar-scan',
        logoVariant: 'scifi',
        movieGenreMatches: ['Science Fiction', 'Sci-Fi'],
    },
    {
        id: 'cyberpunk',
        name: 'Neo Shinjuku 2099',
        subtitle: 'Cyberpunk & Synthwave',
        category: 'genre',
        description: 'Electric hot pink and neon cyan drenched in rain-slicked pavement, digital scanlines, and glitch aesthetics.',
        tagline: 'High Tech, Low Life',
        icon: '⚡',
        badge: 'High Energy',
        colors: {
            brand: '#F43F5E', // Laser Neon Pink
            brandLight: '#FB7185',
            brandDark: '#BE123C',
            bgPrimary: '#090514', // Synth Void
            bgSecondary: '#160E2E',
            bgTertiary: 'rgba(22, 14, 46, 0.6)',
            bgElevated: '#241648',
            textPrimary: '#FDF2F8',
            textSecondary: '#F472B6',
            textTertiary: '#38BDF8',
            borderDefault: 'rgba(244, 63, 94, 0.3)',
            borderSubtle: 'rgba(56, 189, 248, 0.15)',
            borderStrong: 'rgba(244, 63, 94, 0.7)',
            accentGlow: 'rgba(244, 63, 94, 0.45)',
        },
        ambientEffect: 'matrix-rain',
        logoVariant: 'cyberpunk',
    },
    {
        id: 'fantasy',
        name: 'Arcane Realms',
        subtitle: 'Fantasy & High Magic',
        category: 'genre',
        description: 'Glowing ancient runes, celestial stardust, enchanted forest emeralds, and ethereal mystical lighting.',
        tagline: 'Awaken the Ancient Magic',
        icon: '🔮',
        colors: {
            brand: '#A855F7', // Mystic Amethyst
            brandLight: '#C084FC',
            brandDark: '#7E22CE',
            bgPrimary: '#0A0815',
            bgSecondary: '#15102A',
            bgTertiary: 'rgba(21, 16, 42, 0.55)',
            bgElevated: '#221A42',
            textPrimary: '#FAF5FF',
            textSecondary: '#E9D5FF',
            textTertiary: '#A78BFA',
            borderDefault: 'rgba(168, 85, 247, 0.25)',
            borderSubtle: 'rgba(168, 85, 247, 0.08)',
            borderStrong: 'rgba(192, 132, 252, 0.55)',
            accentGlow: 'rgba(168, 85, 247, 0.38)',
        },
        ambientEffect: 'magic-sparkles',
        logoVariant: 'fantasy',
        movieGenreMatches: ['Fantasy'],
    },
    {
        id: 'action',
        name: 'Fury Protocol',
        subtitle: 'Action & Adrenaline',
        category: 'genre',
        description: 'High-contrast asphalt, blazing kinetic embers, armored edges, and relentless blockbuster momentum.',
        tagline: 'Full Throttle, No Compromises',
        icon: '💥',
        colors: {
            brand: '#FF3300', // Kinetic Blazing Ember
            brandLight: '#FF6633',
            brandDark: '#CC2900',
            bgPrimary: '#0F0D0D',
            bgSecondary: '#1F1A19',
            bgTertiary: 'rgba(31, 26, 25, 0.6)',
            bgElevated: '#2B2321',
            textPrimary: '#FFFFFF',
            textSecondary: '#FFB399',
            textTertiary: '#FF6633',
            borderDefault: 'rgba(255, 51, 0, 0.28)',
            borderSubtle: 'rgba(255, 255, 255, 0.08)',
            borderStrong: 'rgba(255, 51, 0, 0.65)',
            accentGlow: 'rgba(255, 51, 0, 0.4)',
        },
        ambientEffect: 'action-embers',
        logoVariant: 'action',
        movieGenreMatches: ['Action'],
    },
    {
        id: 'romance',
        name: 'Moonlit Velvet',
        subtitle: 'Romance & Melodrama',
        category: 'genre',
        description: 'Dreamy blush gradients, drifting rose petals, soft candlelit glow, and timeless emotional warmth.',
        tagline: 'Stories of the Heart',
        icon: '🌹',
        colors: {
            brand: '#EC4899', // Velvet Rose
            brandLight: '#F472B6',
            brandDark: '#BE185D',
            bgPrimary: '#140A10',
            bgSecondary: '#24121D',
            bgTertiary: 'rgba(36, 18, 29, 0.55)',
            bgElevated: '#341B2B',
            textPrimary: '#FFF1F2',
            textSecondary: '#FECDD3',
            textTertiary: '#FDA4AF',
            borderDefault: 'rgba(236, 72, 153, 0.22)',
            borderSubtle: 'rgba(255, 241, 242, 0.08)',
            borderStrong: 'rgba(244, 114, 182, 0.5)',
            accentGlow: 'rgba(236, 72, 153, 0.32)',
        },
        ambientEffect: 'rose-petals',
        logoVariant: 'romance',
        movieGenreMatches: ['Romance'],
    },
    {
        id: 'mystery',
        name: 'Midnight Noir',
        subtitle: 'Mystery, Crime & Thriller',
        category: 'genre',
        description: 'Venetian blind shadows, rainy neon alleys, cold asphalt monochrome, and smoky suspense.',
        tagline: 'Trust No One in the Dark',
        icon: '🕵️',
        colors: {
            brand: '#F59E0B', // Amber Streetlight
            brandLight: '#FCD34D',
            brandDark: '#B45309',
            bgPrimary: '#0B0D11', // Pure Noir Black
            bgSecondary: '#151921',
            bgTertiary: 'rgba(21, 25, 33, 0.6)',
            bgElevated: '#1E242F',
            textPrimary: '#F1F5F9',
            textSecondary: '#94A3B8',
            textTertiary: '#64748B',
            borderDefault: 'rgba(245, 158, 11, 0.2)',
            borderSubtle: 'rgba(255, 255, 255, 0.05)',
            borderStrong: 'rgba(245, 158, 11, 0.5)',
            accentGlow: 'rgba(245, 158, 11, 0.25)',
        },
        ambientEffect: 'noir-rain',
        logoVariant: 'mystery',
        movieGenreMatches: ['Mystery', 'Thriller', 'Crime'],
    },
    {
        id: 'adventure',
        name: 'Terra Incognita',
        subtitle: 'Adventure & Exploration',
        category: 'genre',
        description: 'Worn compass brass, topographical cartography, lush jungle greens, and the thrill of discovery.',
        tagline: 'Chart the Uncharted',
        icon: '🧭',
        colors: {
            brand: '#10B981', // Expedition Emerald
            brandLight: '#34D399',
            brandDark: '#047857',
            bgPrimary: '#0C130F',
            bgSecondary: '#16231B',
            bgTertiary: 'rgba(22, 35, 27, 0.55)',
            bgElevated: '#1F3327',
            textPrimary: '#ECFDF5',
            textSecondary: '#A7F3D0',
            textTertiary: '#6EE7B7',
            borderDefault: 'rgba(16, 185, 129, 0.22)',
            borderSubtle: 'rgba(255, 255, 255, 0.06)',
            borderStrong: 'rgba(52, 211, 153, 0.5)',
            accentGlow: 'rgba(16, 185, 129, 0.3)',
        },
        ambientEffect: 'autumn-leaves',
        logoVariant: 'adventure',
        movieGenreMatches: ['Adventure'],
    },
    {
        id: 'animation',
        name: 'Toon Pop',
        subtitle: 'Animation & Family',
        category: 'genre',
        description: 'Bouncy pop vibrancy, sunshine yellow, bubblegum skies, and joyful illustrated energy.',
        tagline: 'Imagination in Motion',
        icon: '🎨',
        colors: {
            brand: '#38BDF8', // Sky Blue Pop
            brandLight: '#7DD3FC',
            brandDark: '#0284C7',
            bgPrimary: '#0F172A',
            bgSecondary: '#1E293B',
            bgTertiary: 'rgba(30, 41, 59, 0.6)',
            bgElevated: '#283548',
            textPrimary: '#F8FAFC',
            textSecondary: '#FACC15', // Pop Yellow
            textTertiary: '#94A3B8',
            borderDefault: 'rgba(56, 189, 248, 0.28)',
            borderSubtle: 'rgba(250, 204, 21, 0.15)',
            borderStrong: 'rgba(56, 189, 248, 0.65)',
            accentGlow: 'rgba(56, 189, 248, 0.38)',
        },
        ambientEffect: 'magic-sparkles',
        logoVariant: 'animation',
        movieGenreMatches: ['Animation', 'Family'],
    },
    {
        id: 'drama',
        name: 'Cinéma d’Auteur',
        subtitle: 'Drama & Independent Cinema',
        category: 'genre',
        description: 'Understated champagne gold, deep theatrical velvet, refined typography, and emotional gravitas.',
        tagline: 'Every Frame a Story',
        icon: '🎭',
        colors: {
            brand: '#EAB308', // Champagne Gold
            brandLight: '#FDE047',
            brandDark: '#A16207',
            bgPrimary: '#121111',
            bgSecondary: '#201E1D',
            bgTertiary: 'rgba(32, 30, 29, 0.55)',
            bgElevated: '#2D2928',
            textPrimary: '#FEFCE8',
            textSecondary: '#E2E8F0',
            textTertiary: '#94A3B8',
            borderDefault: 'rgba(234, 179, 8, 0.22)',
            borderSubtle: 'rgba(255, 255, 255, 0.05)',
            borderStrong: 'rgba(234, 179, 8, 0.5)',
            accentGlow: 'rgba(234, 179, 8, 0.3)',
        },
        ambientEffect: 'none',
        logoVariant: 'drama',
        movieGenreMatches: ['Drama'],
    },
    {
        id: 'documentary',
        name: '35mm Reel Archive',
        subtitle: 'Documentary & Historical Cinema',
        category: 'genre',
        description: 'Clean monochrome editorial layout, archival sepia warmth, film sprocket marks, and factual clarity.',
        tagline: 'Witness to History',
        icon: '📽️',
        colors: {
            brand: '#D4D4D8', // Archival Platinum
            brandLight: '#FFFFFF',
            brandDark: '#A1A1AA',
            bgPrimary: '#111112',
            bgSecondary: '#1C1C1F',
            bgTertiary: 'rgba(28, 28, 31, 0.55)',
            bgElevated: '#27272B',
            textPrimary: '#F4F4F5',
            textSecondary: '#A1A1AA',
            textTertiary: '#71717A',
            borderDefault: 'rgba(212, 212, 216, 0.2)',
            borderSubtle: 'rgba(255, 255, 255, 0.05)',
            borderStrong: 'rgba(255, 255, 255, 0.45)',
            accentGlow: 'rgba(255, 255, 255, 0.18)',
        },
        ambientEffect: 'none',
        logoVariant: 'documentary',
        movieGenreMatches: ['Documentary', 'History'],
    },

    // ════════════════════════════════════════════════════════════════
    // 3. SPECIAL HORROR MOVIE THEMES
    // ════════════════════════════════════════════════════════════════
    {
        id: 'horror-slasher',
        name: 'Bloodbath: 1984',
        subtitle: 'Inspired by Slasher Classics (Friday the 13th & Scream)',
        category: 'horror',
        description: 'Arterial crimson blood dripping down the vault logo, slash marks, sinister shadows, and VHS tape distortion.',
        tagline: 'What’s Your Favorite Scary Movie?',
        icon: '🩸',
        badge: 'Horror Cinema',
        colors: {
            brand: '#DC2626', // Blood Red
            brandLight: '#EF4444',
            brandDark: '#7F1D1D',
            bgPrimary: '#0A0505', // Coagulated Black
            bgSecondary: '#190A0A',
            bgTertiary: 'rgba(25, 10, 10, 0.6)',
            bgElevated: '#260F0F',
            textPrimary: '#FEE2E2',
            textSecondary: '#FCA5A5',
            textTertiary: '#B91C1C',
            borderDefault: 'rgba(220, 38, 38, 0.35)',
            borderSubtle: 'rgba(220, 38, 38, 0.12)',
            borderStrong: 'rgba(220, 38, 38, 0.75)',
            accentGlow: 'rgba(220, 38, 38, 0.55)',
        },
        ambientEffect: 'bats-fog',
        logoVariant: 'horror-slasher',
        headerGlow: 'linear-gradient(180deg, rgba(220,38,38,0.2) 0%, transparent 100%)',
        movieGenreMatches: ['Horror'],
    },
    {
        id: 'horror-shining',
        name: 'Room 237: Overlook',
        subtitle: 'Inspired by The Shining (Stanley Kubrick)',
        category: 'horror',
        description: 'Iconic geometric hexagon carpet geometry, hedge-maze frost, typewriter madness, and haunting alpine cold.',
        tagline: 'All Work and No Play',
        icon: '🪓',
        badge: 'Kubrick Horror',
        colors: {
            brand: '#EA580C', // Overlook Hexagon Orange
            brandLight: '#FB923C',
            brandDark: '#9A3412',
            bgPrimary: '#0D0807',
            bgSecondary: '#1C1210',
            bgTertiary: 'rgba(28, 18, 16, 0.6)',
            bgElevated: '#2A1B18',
            textPrimary: '#FFEDD5',
            textSecondary: '#FED7AA',
            textTertiary: '#C2410C',
            borderDefault: 'rgba(234, 88, 12, 0.28)',
            borderSubtle: 'rgba(255, 237, 213, 0.08)',
            borderStrong: 'rgba(234, 88, 12, 0.65)',
            accentGlow: 'rgba(234, 88, 12, 0.38)',
        },
        ambientEffect: 'snow',
        logoVariant: 'horror-shining',
        movieGenreMatches: ['Horror', 'Psychological Thriller'],
    },
    {
        id: 'horror-alien',
        name: 'Nostromo LV-426',
        subtitle: 'Inspired by Alien (Ridley Scott)',
        category: 'horror',
        description: 'Phosphor green CRT terminal telemetry, Weyland-Yutani hazard protocols, and motion tracker suspense.',
        tagline: 'In Space No One Can Hear You Scream',
        icon: '👾',
        badge: 'Sci-Fi Horror',
        colors: {
            brand: '#22C55E', // Phosphor Terminal Green
            brandLight: '#4ADE80',
            brandDark: '#15803D',
            bgPrimary: '#050D08', // Cold Deck Black
            bgSecondary: '#0A1A10',
            bgTertiary: 'rgba(10, 26, 16, 0.6)',
            bgElevated: '#102A1A',
            textPrimary: '#DCFCE7',
            textSecondary: '#86EFAC',
            textTertiary: '#22C55E',
            borderDefault: 'rgba(34, 197, 94, 0.3)',
            borderSubtle: 'rgba(34, 197, 94, 0.1)',
            borderStrong: 'rgba(34, 197, 94, 0.7)',
            accentGlow: 'rgba(34, 197, 94, 0.45)',
        },
        ambientEffect: 'radar-scan',
        logoVariant: 'horror-alien',
        movieGenreMatches: ['Horror', 'Science Fiction'],
    },
    {
        id: 'horror-vampire',
        name: 'Nosferatu’s Crypt',
        subtitle: 'Inspired by Dracula & Gothic Horror',
        category: 'horror',
        description: 'Cathedral stone, swarming night bats, crimson goblet wine, ornate silver filigree, and eternal shadows.',
        tagline: 'Children of the Night',
        icon: '🦇',
        badge: 'Gothic Horror',
        colors: {
            brand: '#9333EA', // Royal Nocturne Violet
            brandLight: '#A855F7',
            brandDark: '#6B21A8',
            bgPrimary: '#0B0612',
            bgSecondary: '#160D24',
            bgTertiary: 'rgba(22, 13, 36, 0.6)',
            bgElevated: '#23153A',
            textPrimary: '#F3E8FF',
            textSecondary: '#D8B4FE',
            textTertiary: '#A855F7',
            borderDefault: 'rgba(147, 51, 234, 0.3)',
            borderSubtle: 'rgba(255, 255, 255, 0.06)',
            borderStrong: 'rgba(168, 85, 247, 0.65)',
            accentGlow: 'rgba(147, 51, 234, 0.42)',
        },
        ambientEffect: 'bats-fog',
        logoVariant: 'horror-vampire',
        movieGenreMatches: ['Horror'],
    },
    {
        id: 'horror-lovecraft',
        name: 'Eldritch Abyss',
        subtitle: 'Inspired by Cosmic Dread & Lovecraft',
        category: 'horror',
        description: 'Bioluminescent deep-sea cyan, ancient cyclopean architecture, waking nightmares, and the call of the void.',
        tagline: 'That is Not Dead Which Can Eternal Lie',
        icon: '🐙',
        badge: 'Cosmic Horror',
        colors: {
            brand: '#0D9488', // Abyssal Bioluminescence
            brandLight: '#14B8A6',
            brandDark: '#0F766E',
            bgPrimary: '#040B0C',
            bgSecondary: '#081719',
            bgTertiary: 'rgba(8, 23, 25, 0.6)',
            bgElevated: '#0D2529',
            textPrimary: '#CCFBF1',
            textSecondary: '#5EEAD4',
            textTertiary: '#0D9488',
            borderDefault: 'rgba(13, 148, 136, 0.32)',
            borderSubtle: 'rgba(13, 148, 136, 0.1)',
            borderStrong: 'rgba(20, 184, 166, 0.68)',
            accentGlow: 'rgba(13, 148, 136, 0.45)',
        },
        ambientEffect: 'cosmic-void',
        logoVariant: 'horror-lovecraft',
        movieGenreMatches: ['Horror'],
    },
];

export const THEME_MAP = new Map<string, ThemeDefinition>(THEMES.map((t) => [t.id, t]));

export function getThemeById(id: string): ThemeDefinition {
    return THEME_MAP.get(id) ?? THEMES[0];
}

export function findThemeByGenre(genreName: string): ThemeDefinition | undefined {
    const lower = genreName.toLowerCase();
    return THEMES.find((t) =>
        t.movieGenreMatches?.some((g) => g.toLowerCase() === lower || lower.includes(g.toLowerCase()))
    );
}

/**
 * Returns the automatic seasonal theme based on the current calendar month:
 * - October (Month 9): Halloween (Spooky All Hallows)
 * - November (Month 10): Thanksgiving / Autumn (Autumn Harvest)
 * - December & January (Month 11, 0): Christmas / Winter (Winter Wonderland)
 * - February (Month 1): Romance (Moonlit Velvet)
 * - Default: FrameVault Classic
 */
export function getCurrentSeasonalTheme(): ThemeDefinition {
    const month = new Date().getMonth();
    if (month === 9) {
        return getThemeById('halloween');
    }
    if (month === 10) {
        return getThemeById('thanksgiving');
    }
    if (month === 11 || month === 0) {
        return getThemeById('christmas');
    }
    if (month === 1) {
        return getThemeById('romance');
    }
    return getThemeById('default');
}

export interface MediaVibeInput {
    title?: string;
    genres?: Array<{ id?: number | string; name: string }>;
    overview?: string;
    tagline?: string;
}

/**
 * Detects the most atmospheric theme for a movie or TV show
 * based on its title, genres, overview, and tagline.
 */
export function detectMediaAtmosphere(input: MediaVibeInput): ThemeDefinition {
    const text = [
        input.title || '',
        input.tagline || '',
        input.overview || '',
    ].join(' ').toLowerCase();

    const genreNames = (input.genres || []).map((g) => g.name.toLowerCase());

    // ── 1. Specific Horror Icons & Subgenres ──
    // Vampires & Gothic Horror (e.g. Dracula, Nosferatu, Twilight, Blade, Underworld)
    if (
        /\b(vampire|vampires|dracula|nosferatu|undead|transylvania|van helsing|blood-drink|gothic horror|fright night|blade|underworld|midnight mass|what we do in the shadows)\b/.test(text)
    ) {
        return getThemeById('horror-vampire');
    }

    // Slasher / 80s Splatter & Gore (e.g. Bloodbath 1984, Scream, Friday the 13th, Halloween, Texas Chainsaw, Saw)
    if (
        /\b(slasher|chainsaw|machete|axe murderer|serial killer|bloodbath|camp crystal lake|jason voorhees|freddy krueger|elm street|michael myers|ghostface|scream|chucky|massacre|saw|jigsaw|gore|gory|splatter|slashed)\b/.test(text)
    ) {
        return getThemeById('horror-slasher');
    }

    // Deep Space Alien / Sci-Fi Horror (e.g. Alien, Aliens, Nostromo, The Thing, Predator)
    if (
        /\b(xenomorph|nostromo|weyland|facehugger|chestburster|space horror|the thing|dead space|alien terror)\b/.test(text) ||
        (genreNames.includes('horror') && /\b(alien|extraterrestrial|spaceship|deep space|predator)\b/.test(text))
    ) {
        return getThemeById('horror-alien');
    }

    // Overlook / Winter Isolation / Psychological Horror (e.g. The Shining, Room 237, Misery)
    if (
        /\b(overlook hotel|room 237|haunted hotel|isolated hotel|blizzard isolation|cabin fever|misery|stephen king)\b/.test(text) ||
        (genreNames.includes('horror') && /\b(hotel|blizzard|isolated cabin|snowbound)\b/.test(text))
    ) {
        return getThemeById('horror-shining');
    }

    // Cosmic Dread / Eldritch Void (e.g. Lovecraft, Cthulhu, The Mist, Annihilation)
    if (
        /\b(lovecraft|lovecraftian|cthulhu|eldritch|cosmic horror|cyclopean|ancient entity|abyssal void|dagon)\b/.test(text)
    ) {
        return getThemeById('horror-lovecraft');
    }

    // ── 2. Cinematic Seasons & Atmospheric Settings ──
    // Autumn / Thanksgiving vibe
    if (
        /\b(autumn|fall foliage|thanksgiving|harvest festival|indian summer)\b/.test(text)
    ) {
        return getThemeById('thanksgiving');
    }

    // Christmas / Winter Holiday vibe
    if (
        /\b(christmas|xmas|santa claus|north pole|holiday season|home alone|the grinch|winter wonderland|polar express|miracle on 34th)\b/.test(text)
    ) {
        return getThemeById('christmas');
    }

    // Halloween vibe
    if (
        /\b(halloween|trick or treat|jack-o-lantern|hocus pocus|beetlejuice|haunted house)\b/.test(text)
    ) {
        return getThemeById('halloween');
    }

    // Cyberpunk aesthetic
    if (
        /\b(cyberpunk|blade runner|neuromancer|akira|ghost in the shell|cyborg|dystopian neo|matrix)\b/.test(text)
    ) {
        return getThemeById('cyberpunk');
    }

    // ── 3. Primary Genre Fallback ──
    for (const genre of genreNames) {
        if (genre === 'horror') {
            return getThemeById('horror-slasher'); // Iconic horror atmosphere
        }
        if (genre === 'science fiction' || genre === 'sci-fi') {
            return getThemeById('scifi');
        }
        if (genre === 'fantasy') {
            return getThemeById('fantasy');
        }
        if (genre === 'animation') {
            return getThemeById('animation');
        }
        if (genre === 'romance') {
            return getThemeById('romance');
        }
        if (genre === 'action') {
            return getThemeById('action');
        }
        if (genre === 'mystery' || genre === 'thriller' || genre === 'crime') {
            return getThemeById('mystery');
        }
        if (genre === 'adventure' || genre === 'western') {
            return getThemeById('adventure');
        }
        if (genre === 'documentary') {
            return getThemeById('documentary');
        }
        if (genre === 'drama') {
            return getThemeById('drama');
        }
        if (genre === 'comedy') {
            return getThemeById('animation');
        }
    }

    return getCurrentSeasonalTheme();
}
