export type ThemeCategory = 'all' | 'seasonal' | 'genre' | 'horror' | 'default';

export type AmbientEffectType =
    | 'none'
    | 'snow'
    | 'halloween-fog'
    | 'autumn-leaves'
    | 'magic-sparkles'
    | 'matrix-rain'
    | 'action-embers'
    | 'rose-petals'
    | 'noir-rain'
    | 'radar-scan'
    | 'bats-fog'
    | 'cosmic-void';

export interface ThemeColors {
    brand: string;
    brandLight: string;
    brandDark: string;
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgElevated: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    borderDefault: string;
    borderSubtle: string;
    borderStrong: string;
    accentGlow: string;
}

export interface ThemeDefinition {
    id: string;
    name: string;
    subtitle: string;
    category: 'seasonal' | 'genre' | 'horror' | 'default';
    description: string;
    tagline: string;
    icon: string; // Emoji
    badge?: string;
    colors: ThemeColors;
    ambientEffect: AmbientEffectType;
    fontFamily?: string;
    cardBorderRadius?: string;
    headerGlow?: string;
    logoVariant:
        | 'default'
        | 'christmas'
        | 'halloween'
        | 'thanksgiving'
        | 'scifi'
        | 'cyberpunk'
        | 'fantasy'
        | 'action'
        | 'romance'
        | 'mystery'
        | 'adventure'
        | 'animation'
        | 'drama'
        | 'documentary'
        | 'horror-slasher'
        | 'horror-shining'
        | 'horror-alien'
        | 'horror-vampire'
        | 'horror-lovecraft';
    movieGenreMatches?: string[]; // TMDB genre names or keywords that match this theme
}

export interface ThemeContextValue {
    currentTheme: ThemeDefinition;
    themeId: string;
    setTheme: (id: string) => void;
    effectsEnabled: boolean;
    setEffectsEnabled: (enabled: boolean) => void;
    toggleEffects: () => void;
    isModalOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
    previewTheme: (id: string | null) => void;
    previewId: string | null;
}
