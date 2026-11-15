'use client';

import { useTheme } from '@/lib/themes/theme-context';
import { findThemeByGenre } from '@/lib/themes/registry';
import ThemedIcon from './ThemedIcon';
import { Sparkles, Check } from 'lucide-react';

interface AtmosphereButtonProps {
    genres?: { name: string }[];
}

export default function AtmosphereButton({ genres }: AtmosphereButtonProps) {
    const { themeId, setTheme, openModal } = useTheme();

    if (!genres || genres.length === 0) return null;

    // Find the first genre that matches a theme
    let matchedTheme = undefined;
    for (const g of genres) {
        const found = findThemeByGenre(g.name);
        if (found) {
            matchedTheme = found;
            break;
        }
    }

    if (!matchedTheme) {
        return (
            <button
                type="button"
                onClick={openModal}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                }}
                title="Explore immersive site themes"
            >
                <Sparkles size={14} color="var(--brand)" />
                <span>Atmosphere</span>
            </button>
        );
    }

    const isCurrentTheme = themeId === matchedTheme.id;

    return (
        <button
            type="button"
            onClick={() => {
                if (isCurrentTheme) {
                    openModal();
                } else {
                    setTheme(matchedTheme.id);
                }
            }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 15px',
                borderRadius: 'var(--radius-full)',
                border: isCurrentTheme ? `1px solid ${matchedTheme.colors.brand}` : '1px solid var(--border-strong)',
                background: isCurrentTheme ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-secondary)',
                color: isCurrentTheme ? matchedTheme.colors.brandLight : 'var(--text-primary)',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isCurrentTheme ? `0 0 16px ${matchedTheme.colors.accentGlow}` : 'none',
            }}
            title={isCurrentTheme ? `Theme active: ${matchedTheme.name}` : `Match movie atmosphere: ${matchedTheme.name}`}
        >
            <ThemedIcon themeId={matchedTheme.id} size={15} primaryColor={matchedTheme.colors.brand} secondaryColor={matchedTheme.colors.brandLight} />
            <span>{isCurrentTheme ? `Atmosphere: ${matchedTheme.name}` : `Atmosphere: ${matchedTheme.name}`}</span>
            {isCurrentTheme ? <Check size={14} color={matchedTheme.colors.brand} strokeWidth={3} /> : <Sparkles size={14} color="var(--brand)" />}
        </button>
    );
}
