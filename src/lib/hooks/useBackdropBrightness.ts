'use client';

import useSWR from 'swr';

const fetcher = (url: string) =>
    fetch(url).then((r) => (r.ok ? r.json() : null));

/**
 * Returns the user's saved backdrop brightness (5–75, default 40).
 * 40 ≈ current defaults:
 *   - Hero carousel  → brightness(0.40)
 *   - Movie/show bg  → opacity(0.10)   (value * 0.25 / 100)
 */
export function useBackdropBrightness(): number {
    const { data } = useSWR('/api/users/me', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
    });
    return data?.data?.profile?.backdropBrightness ?? 60;
}
