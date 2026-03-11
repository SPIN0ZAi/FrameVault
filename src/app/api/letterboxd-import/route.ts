import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import https from 'https';
import http from 'http';

export const maxDuration = 60;

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
};

function getPage(url: string, extraHeaders: Record<string, string> = {}): Promise<{ status: number; html: string; location?: string }> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const options = {
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            headers: { ...BROWSER_HEADERS, ...extraHeaders },
            timeout: 15000,
        };
        const req = lib.get(options, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve({ status: res.statusCode, html: '', location: res.headers.location });
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve({ status: res.statusCode ?? 0, html: data }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout fetching ${url}`)); });
    });
}

async function fetchWithRedirects(url: string, depth = 0): Promise<string> {
    if (depth > 5) throw new Error('Too many redirects');
    const { status, html, location } = await getPage(url);
    if (location) {
        const next = location.startsWith('http') ? location : `https://letterboxd.com${location}`;
        return fetchWithRedirects(next, depth + 1);
    }
    if (status === 403) throw new Error(`Letterboxd blocked this request (HTTP 403). The list may be private or restricted.`);
    if (status === 404) throw new Error(`List not found (HTTP 404). Check the URL and make sure the list is public.`);
    if (status !== 200) throw new Error(`Letterboxd returned HTTP ${status}.`);
    return html;
}

// ─── HTML parsing ─────────────────────────────────────────────────────────────

function decodeEntities(s: string) {
    return s
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
        .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

interface LbFilm { slug: string; title: string; year?: number }

function parseFilms(html: string): LbFilm[] {
    const results: LbFilm[] = [];
    const seen = new Set<string>();

    const slugs: string[] = [];
    const names: string[] = [];

    let m: RegExpExecArray | null;
    const slugRe = /data-item-slug="([^"]+)"/g;
    const nameRe = /data-item-name="([^"]+)"/g;

    while ((m = slugRe.exec(html)) !== null) slugs.push(m[1]);
    while ((m = nameRe.exec(html)) !== null) names.push(decodeEntities(m[1]));

    for (let i = 0; i < slugs.length; i++) {
        const slug = slugs[i];
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);

        const nameStr = names[i] ?? '';
        // "Before Midnight (2013)" → title="Before Midnight", year=2013
        const yearMatch = nameStr.match(/\((\d{4})\)\s*$/);
        const year = yearMatch ? +yearMatch[1] : undefined;
        const title = yearMatch
            ? nameStr.slice(0, nameStr.lastIndexOf('(')).trim()
            : nameStr || slug.replace(/-/g, ' ');

        results.push({ slug, title, year });
    }
    return results;
}

function extractTitle(html: string): string {
    const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)?.[1]
            ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/)?.[1];
    if (og) return decodeEntities(og.replace(/\s*[|·—–].*$/, '').trim());
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, '').trim();
    return h1 ? decodeEntities(h1) : 'Imported List';
}

function extractMaxPage(html: string): number {
    const nums = [...html.matchAll(/\/page\/(\d+)\//g)].map(m => +m[1]);
    return nums.length ? Math.max(...nums) : 1;
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

function normalizeUrl(rawUrl: string): string {
    let url = rawUrl.trim().replace(/\/+$/, '');
    if (!url.startsWith('http')) url = `https://${url}`;
    // Always use the regular list page (not /detail/)
    url = url.replace(/\/detail(\/.*)?$/, '');
    return url;
}

async function scrapeList(rawUrl: string): Promise<{ films: LbFilm[]; listTitle: string; listUrl: string }> {
    let url = normalizeUrl(rawUrl);

    // Follow boxd.it short links
    if (url.includes('boxd.it')) {
        const { location, status } = await getPage(url);
        if (location) url = normalizeUrl(location.startsWith('http') ? location : `https://letterboxd.com${location}`);
        else if (status !== 200) throw new Error(`Could not resolve short link (HTTP ${status})`);
    }

    if (!url.includes('letterboxd.com')) {
        throw new Error('URL must be a Letterboxd list URL (letterboxd.com/username/list/slug/)');
    }

    // Fetch first page
    const firstHtml = await fetchWithRedirects(url);
    const listTitle = extractTitle(firstHtml);
    const maxPage   = extractMaxPage(firstHtml);
    const allFilms  = parseFilms(firstHtml);

    // Fetch additional pages concurrently (5 at a time)
    if (maxPage > 1) {
        const pages = Array.from({ length: maxPage - 1 }, (_, i) => i + 2);
        const CONCURRENCY = 5;
        for (let i = 0; i < pages.length; i += CONCURRENCY) {
            const batch = pages.slice(i, i + CONCURRENCY);
            const htmlPages = await Promise.all(batch.map(p => fetchWithRedirects(`${url}/page/${p}/`)));
            for (const html of htmlPages) allFilms.push(...parseFilms(html));
        }
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = allFilms.filter(f => {
        if (seen.has(f.slug)) return false;
        seen.add(f.slug);
        return true;
    });

    return { films: unique, listTitle, listUrl: url };
}

// ─── TMDB search ─────────────────────────────────────────────────────────────

interface TmdbHit { tmdbId: number; title: string; year: number | null; posterUrl: string | null }

async function tmdbSearch(title: string, year?: number): Promise<TmdbHit | null> {
    const key = process.env.TMDB_API_KEY;
    if (!key) return null;
    const q = encodeURIComponent(title);
    const y = year ? `&year=${year}` : '';
    const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${q}${y}&language=en-US&page=1`;
    try {
        const res = await fetch(apiUrl);
        const d = await res.json();
        if (d.results?.length > 0) {
            const m = d.results[0];
            return {
                tmdbId:    m.id,
                title:     m.title,
                year:      m.release_date ? +m.release_date.split('-')[0] : null,
                posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
            };
        }
    } catch { /* ignore */ }
    return null;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { url, customTitle } = body as { url?: string; customTitle?: string };
        if (!url?.trim()) return NextResponse.json({ error: 'url is required' }, { status: 400 });

        // 1. Scrape Letterboxd
        let films: LbFilm[], listTitle: string, listUrl: string;
        try {
            ({ films, listTitle, listUrl } = await scrapeList(url));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to fetch the Letterboxd list';
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        if (films.length === 0) {
            return NextResponse.json({ error: 'No films found — the list may be empty or private.' }, { status: 400 });
        }

        // 2. Create the list
        const finalTitle = customTitle?.trim() || listTitle;
        const list = await prisma.list.create({
            data: {
                userId:      session.user.id,
                title:       finalTitle,
                description: `Imported from Letterboxd: ${listUrl}`,
                isPublic:    true,
            },
        });

        // 3. TMDB search + DB insert in parallel batches of 20
        const BATCH = 20;
        let added = 0, notFound = 0;

        for (let i = 0; i < films.length; i += BATCH) {
            const batch = films.slice(i, i + BATCH);
            const resolved = await Promise.all(batch.map(async (film, bi) => {
                let hit = await tmdbSearch(film.title, film.year);
                if (!hit && film.year) hit = await tmdbSearch(film.title);
                return { hit, position: i + bi };
            }));

            const rows = resolved
                .filter((r): r is { hit: TmdbHit; position: number } => r.hit !== null)
                .map(({ hit, position }) => ({
                    listId:    list.id,
                    tmdbId:    hit.tmdbId,
                    title:     hit.title,
                    year:      hit.year,
                    posterUrl: hit.posterUrl,
                    position,
                    mediaType: 'movie' as const,
                }));

            await prisma.listMovie.createMany({ data: rows, skipDuplicates: true });
            added    += rows.length;
            notFound += batch.length - rows.length;
        }

        return NextResponse.json({ listId: list.id, title: finalTitle, total: films.length, added, notFound });
    } catch (error) {
        console.error('POST /api/letterboxd-import error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
