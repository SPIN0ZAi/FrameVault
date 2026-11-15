'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeDefinition, ThemeContextValue } from './types';
import { THEMES, getThemeById } from './registry';

const THEME_STORAGE_KEY = 'framevault_site_theme';
const EFFECTS_STORAGE_KEY = 'framevault_effects_enabled';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeId, setThemeIdState] = useState<string>('default');
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [effectsEnabled, setEffectsEnabledState] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState<boolean>(false);

    // Load persisted theme and effects preference on mount
    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme && THEMES.some(t => t.id === savedTheme)) {
                setThemeIdState(savedTheme);
                document.documentElement.setAttribute('data-theme', savedTheme);
            } else {
                document.documentElement.setAttribute('data-theme', 'default');
            }

            const savedEffects = localStorage.getItem(EFFECTS_STORAGE_KEY);
            if (savedEffects !== null) {
                setEffectsEnabledState(savedEffects === 'true');
            }
        } catch {
            // Storage access blocked or unavailable
        }
        setIsMounted(true);
    }, []);

    // Apply active or preview theme to HTML data-theme attribute
    const activeThemeId = previewId || themeId;
    const currentTheme = useMemo(() => getThemeById(activeThemeId), [activeThemeId]);

    useEffect(() => {
        if (!isMounted) return;
        document.documentElement.setAttribute('data-theme', currentTheme.id);
    }, [currentTheme.id, isMounted]);

    const setTheme = useCallback((id: string) => {
        const target = getThemeById(id);
        setThemeIdState(target.id);
        setPreviewId(null);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, target.id);
        } catch {
            // ignore
        }
    }, []);

    const previewTheme = useCallback((id: string | null) => {
        setPreviewId(id);
    }, []);

    const setEffectsEnabled = useCallback((enabled: boolean) => {
        setEffectsEnabledState(enabled);
        try {
            localStorage.setItem(EFFECTS_STORAGE_KEY, String(enabled));
        } catch {
            // ignore
        }
    }, []);

    const toggleEffects = useCallback(() => {
        setEffectsEnabledState(prev => {
            const next = !prev;
            try {
                localStorage.setItem(EFFECTS_STORAGE_KEY, String(next));
            } catch {
                // ignore
            }
            return next;
        });
    }, []);

    const openModal = useCallback(() => setIsModalOpen(true), []);
    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setPreviewId(null); // Clear preview when closing modal
    }, []);

    const value = useMemo<ThemeContextValue>(() => ({
        currentTheme,
        themeId,
        setTheme,
        effectsEnabled,
        setEffectsEnabled,
        toggleEffects,
        isModalOpen,
        openModal,
        closeModal,
        previewTheme,
        previewId,
    }), [
        currentTheme,
        themeId,
        setTheme,
        effectsEnabled,
        setEffectsEnabled,
        toggleEffects,
        isModalOpen,
        openModal,
        closeModal,
        previewTheme,
        previewId,
    ]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return ctx;
}
