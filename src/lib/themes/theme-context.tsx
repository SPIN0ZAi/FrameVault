'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeDefinition, ThemeContextValue, ThemeMode } from './types';
import { THEMES, getThemeById, getCurrentSeasonalTheme } from './registry';

const THEME_STORAGE_KEY = 'framevault_site_theme';
const THEME_MODE_STORAGE_KEY = 'framevault_theme_mode';
const ADAPT_MOVIE_STORAGE_KEY = 'framevault_adapt_movie_atmosphere';
const EFFECTS_STORAGE_KEY = 'framevault_effects_enabled';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // 'auto' means following the seasonal calendar across the site; otherwise pinned custom theme
    const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
    const [userThemeId, setUserThemeIdState] = useState<string>('auto');
    const [pageAtmosphere, setPageAtmosphereState] = useState<ThemeDefinition | null>(null);
    const [adaptMovieAtmosphere, setAdaptMovieAtmosphereState] = useState<boolean>(true);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [effectsEnabled, setEffectsEnabledState] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState<boolean>(false);

    // Load persisted preferences on mount
    useEffect(() => {
        try {
            const savedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode | null;
            if (savedMode === 'custom' || savedMode === 'auto') {
                setThemeModeState(savedMode);
            }

            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme && (savedTheme === 'auto' || THEMES.some(t => t.id === savedTheme))) {
                setUserThemeIdState(savedTheme);
                if (savedTheme !== 'auto') {
                    setThemeModeState('custom');
                }
            }

            const savedAdapt = localStorage.getItem(ADAPT_MOVIE_STORAGE_KEY);
            if (savedAdapt !== null) {
                setAdaptMovieAtmosphereState(savedAdapt === 'true');
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

    // Determine the active theme
    // Priority: 1. Live Preview -> 2. Page Atmosphere (if on movie/show page & enabled) -> 3. Pinned custom theme (if mode === 'custom') -> 4. Seasonal theme
    const currentTheme = useMemo<ThemeDefinition>(() => {
        if (previewId) {
            return getThemeById(previewId);
        }

        if (pageAtmosphere && adaptMovieAtmosphere) {
            return pageAtmosphere;
        }

        if (themeMode === 'custom' && userThemeId && userThemeId !== 'auto') {
            return getThemeById(userThemeId);
        }

        // Default: dynamic seasonal atmosphere
        return getCurrentSeasonalTheme();
    }, [previewId, pageAtmosphere, adaptMovieAtmosphere, themeMode, userThemeId]);

    // Apply active theme to HTML data-theme attribute
    useEffect(() => {
        if (!isMounted) return;
        document.documentElement.setAttribute('data-theme', currentTheme.id);
    }, [currentTheme.id, isMounted]);

    const setTheme = useCallback((id: string) => {
        if (id === 'auto') {
            setThemeModeState('auto');
            setUserThemeIdState('auto');
            try {
                localStorage.setItem(THEME_MODE_STORAGE_KEY, 'auto');
                localStorage.setItem(THEME_STORAGE_KEY, 'auto');
            } catch {
                // ignore
            }
        } else {
            const target = getThemeById(id);
            setThemeModeState('custom');
            setUserThemeIdState(target.id);
            try {
                localStorage.setItem(THEME_MODE_STORAGE_KEY, 'custom');
                localStorage.setItem(THEME_STORAGE_KEY, target.id);
            } catch {
                // ignore
            }
        }
        setPreviewId(null);
    }, []);

    const setThemeMode = useCallback((mode: ThemeMode) => {
        setThemeModeState(mode);
        try {
            localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
        } catch {
            // ignore
        }
    }, []);

    const setAdaptMovieAtmosphere = useCallback((enabled: boolean) => {
        setAdaptMovieAtmosphereState(enabled);
        try {
            localStorage.setItem(ADAPT_MOVIE_STORAGE_KEY, String(enabled));
        } catch {
            // ignore
        }
    }, []);

    const setPageAtmosphere = useCallback((theme: ThemeDefinition | null) => {
        setPageAtmosphereState(theme);
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
        setPreviewId(null);
    }, []);

    const value = useMemo<ThemeContextValue>(() => ({
        currentTheme,
        themeId: currentTheme.id,
        userThemeId,
        themeMode,
        setTheme,
        setThemeMode,
        adaptMovieAtmosphere,
        setAdaptMovieAtmosphere,
        pageAtmosphere,
        setPageAtmosphere,
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
        userThemeId,
        themeMode,
        setTheme,
        setThemeMode,
        adaptMovieAtmosphere,
        setAdaptMovieAtmosphere,
        pageAtmosphere,
        setPageAtmosphere,
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
