'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/lib/themes/theme-context';
import { THEMES } from '@/lib/themes/registry';
import { ThemeCategory, ThemeDefinition } from '@/lib/themes/types';
import ThemedLogo from './ThemedLogo';
import { X, Sparkles, Check, Eye } from 'lucide-react';

const CATEGORIES: { id: ThemeCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All Themes', icon: '✨' },
    { id: 'seasonal', label: 'Seasonal & Holidays', icon: '🎄' },
    { id: 'genre', label: 'Movie Genres', icon: '🎬' },
    { id: 'horror', label: 'Horror Cinema', icon: '🩸' },
];

export default function ThemeSelectorModal() {
    const {
        themeId,
        setTheme,
        effectsEnabled,
        toggleEffects,
        isModalOpen,
        closeModal,
        previewTheme,
        previewId,
    } = useTheme();

    const [activeCategory, setActiveCategory] = useState<ThemeCategory>('all');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, closeModal]);

    if (!isModalOpen) return null;

    const filteredThemes = THEMES.filter((theme) => {
        if (activeCategory === 'all') return true;
        return theme.category === activeCategory;
    });

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(10px)',
            }}
            onClick={closeModal}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '1020px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-strong)',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
                    overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div
                    style={{
                        padding: '24px 28px',
                        borderBottom: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: 'rgba(0, 209, 193, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--brand)',
                                }}
                            >
                                <Sparkles size={20} />
                            </div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                Immersive Theme Collection
                            </h2>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                            Transform FrameVault into distinct cinematic worlds, seasonal atmospheres, and iconic horror aesthetics.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Ambient Effects Toggle */}
                        <button
                            type="button"
                            onClick={toggleEffects}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 14px',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--border-default)',
                                background: effectsEnabled ? 'rgba(0, 209, 193, 0.15)' : 'var(--bg-tertiary)',
                                color: effectsEnabled ? 'var(--brand)' : 'var(--text-tertiary)',
                                fontSize: '0.825rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            title="Toggle falling snow, leaves, fog, and ambient particle effects"
                        >
                            <span>{effectsEnabled ? '✨ Ambient FX: ON' : '⏸️ Ambient FX: OFF'}</span>
                        </button>

                        {/* Close Modal Button */}
                        <button
                            type="button"
                            onClick={closeModal}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                border: '1px solid var(--border-default)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                            aria-label="Close theme modal"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Category Navigation Tabs */}
                <div
                    style={{
                        padding: '12px 28px',
                        background: 'var(--bg-primary)',
                        borderBottom: '1px solid var(--border-default)',
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                    }}
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '7px 16px',
                                    borderRadius: 'var(--radius-full)',
                                    border: 'none',
                                    background: isActive ? 'var(--brand)' : 'var(--bg-secondary)',
                                    color: isActive ? '#000' : 'var(--text-secondary)',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Theme Grid */}
                <div
                    style={{
                        padding: '24px 28px',
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '16px',
                        maxHeight: '62vh',
                    }}
                >
                    {filteredThemes.map((theme: ThemeDefinition) => {
                        const isSelected = themeId === theme.id;
                        const isPreviewing = previewId === theme.id;

                        return (
                            <div
                                key={theme.id}
                                onClick={() => setTheme(theme.id)}
                                onMouseEnter={() => previewTheme(theme.id)}
                                onMouseLeave={() => previewTheme(null)}
                                style={{
                                    position: 'relative',
                                    borderRadius: 'var(--radius-md)',
                                    background: theme.colors.bgPrimary,
                                    border: isSelected
                                        ? `2px solid ${theme.colors.brand}`
                                        : isPreviewing
                                        ? `2px solid ${theme.colors.brandLight}`
                                        : `1px solid ${theme.colors.borderDefault}`,
                                    padding: '18px',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: isSelected || isPreviewing
                                        ? `0 8px 30px ${theme.colors.accentGlow}`
                                        : '0 4px 12px rgba(0, 0, 0, 0.2)',
                                    transform: isPreviewing ? 'translateY(-2px)' : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div>
                                    {/* Top Row: Mini Themed Logo & Badges */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <ThemedLogo theme={theme} size={28} showText={false} />

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {theme.badge && (
                                                <span
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        padding: '3px 8px',
                                                        borderRadius: 'var(--radius-full)',
                                                        background: 'rgba(255, 255, 255, 0.08)',
                                                        color: theme.colors.brandLight,
                                                        border: `1px solid ${theme.colors.borderDefault}`,
                                                    }}
                                                >
                                                    {theme.badge}
                                                </span>
                                            )}

                                            {isSelected && (
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        padding: '3px 9px',
                                                        borderRadius: 'var(--radius-full)',
                                                        background: theme.colors.brand,
                                                        color: '#000',
                                                    }}
                                                >
                                                    <Check size={12} strokeWidth={3} /> Active
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Title & Tagline */}
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: theme.colors.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>{theme.icon}</span>
                                        <span>{theme.name}</span>
                                    </h3>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.colors.brand, marginTop: '2px', marginBottom: '8px' }}>
                                        {theme.tagline}
                                    </p>
                                    <p style={{ fontSize: '0.8rem', color: theme.colors.textSecondary, lineHeight: 1.4, margin: 0 }}>
                                        {theme.description}
                                    </p>
                                </div>

                                {/* Bottom Row: Color Swatches & Apply Button */}
                                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${theme.colors.borderSubtle}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div
                                            style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                background: theme.colors.brand,
                                                boxShadow: `0 0 8px ${theme.colors.brand}`,
                                            }}
                                            title={`Brand: ${theme.colors.brand}`}
                                        />
                                        <div
                                            style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                background: theme.colors.brandLight,
                                            }}
                                            title={`Accent: ${theme.colors.brandLight}`}
                                        />
                                        <div
                                            style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                background: theme.colors.bgSecondary,
                                                border: `1px solid ${theme.colors.borderDefault}`,
                                            }}
                                            title={`Surface: ${theme.colors.bgSecondary}`}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTheme(theme.id);
                                        }}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: isSelected ? 'rgba(255, 255, 255, 0.1)' : theme.colors.brand,
                                            color: isSelected ? theme.colors.textPrimary : '#000',
                                            fontWeight: 700,
                                            fontSize: '0.775rem',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'transform 0.15s ease',
                                        }}
                                    >
                                        {isSelected ? 'Selected' : 'Apply Theme'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Bar with Preview status */}
                <div
                    style={{
                        padding: '14px 28px',
                        background: 'var(--bg-primary)',
                        borderTop: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Eye size={15} color="var(--brand)" />
                        <span>Hover over any theme card to preview it live across the entire website.</span>
                    </div>

                    <button
                        type="button"
                        onClick={closeModal}
                        style={{
                            padding: '8px 20px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--brand)',
                            color: '#000',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
