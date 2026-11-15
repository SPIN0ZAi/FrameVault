'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr-config';
import { ThemeProvider, useTheme } from '@/lib/themes/theme-context';
import AmbientCanvas from '@/components/themes/AmbientCanvas';
import ThemeSelectorModal from '@/components/themes/ThemeSelectorModal';

function ThemeEffectsWrapper({ children }: { children: React.ReactNode }) {
    const { currentTheme, effectsEnabled } = useTheme();
    return (
        <>
            <AmbientCanvas effect={currentTheme.ambientEffect} enabled={effectsEnabled} />
            {children}
            <ThemeSelectorModal />
        </>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <SWRConfig value={swrConfig}>
                <ThemeProvider>
                    <ThemeEffectsWrapper>
                        {children}
                    </ThemeEffectsWrapper>
                </ThemeProvider>
            </SWRConfig>
        </SessionProvider>
    );
}
