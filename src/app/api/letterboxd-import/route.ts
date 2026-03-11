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

    // Strategy 1: data-item-slug + data-item-name (most common for list pages)
    const slugs: string[] = [];
    const names: string[] = [];
    let m: RegExpExecArray | null;
    const slugRe  = /data-item-slug="([^"]+)"/g;
    const nameRe  = /data-item-name="([^"]+)"/g;
    while ((m = slugRe.exec(html))  !== null) slugs.push(m[1]);
    while ((m = nameRe.exec(html))  !== null) names.push(decodeEntities(m[1]));

    if (slugs.length > 0) {
        for (let i = 0; i < slugs.length; i++) {
            const slug = slugs[i];
            if (!slug || seen.has(slug)) continue;
            seen.add(slug);
            const nameStr  = names[i] ?? '';
            const yearMatch = nameStr.match(/\((\d{4})\)\s*$/);
            const year      = yearMatch ? +yearMatch[1] : undefined;
            const title     = yearMatch ? nameStr.slice(0, nameStr.lastIndexOf('(')).trim() : (nameStr || slug.replace(/-/g, ' '));
            results.push({ slug, title, year });
        }
        return results;
    }

    // Strategy 2: data-film-slug (older list layout / watchlists)
    const filmRe   = /data-film-slug="([^"]+)"/g;
    const filmSlugs: string[] = [];
    while ((m = filmRe.exec(html)) !== null) filmSlugs.push(m[1]);

    // Also try to get titles from data-film-name or alt attributes near those slugs
    const altTitleRe = /data-film-slug="([^"]+)"[^>]*>[^<]*<img[^>]+alt="([^"]+)"/g;
    const slugToTitle: Record<string, string> = {};
    while ((m = altTitleRe.exec(html)) !== null) {
        slugToTitle[m[1]] = decodeEntities(m[2]);
    }

    for (const slug of filmSlugs) {
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        const rawTitle  = slugToTitle[slug] ?? '';
        const yearMatch  = rawTitle.match(/\((\d{4})\)\s*$/);
        const year       = yearMatch ? +yearMatch[1] : undefined;
        const title      = yearMatch ? rawTitle.slice(0, rawTitle.lastIndexOf('(')).trim() : (rawTitle || slug.replace(/-/g, ' '));
        results.push({ slug, title, year });
    }

    // Strategy 3: data-target-link="/film/slug/"
    if (results.length === 0) {
        const targetRe = /data-target-link="\/film\/([^/"]+)\/"/g;
        while ((m = targetRe.exec(html)) !== null) {
            const slug = m[1];
            if (!slug || seen.has(slug)) continue;
            seen.add(slug);
            results.push({ slug, title: slug.replace(/-/g, ' '), year: undefined });
        }
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
    if (!key) { console.error('[import] TMDB_API_KEY not set'); return null; }
    const q = encodeURIComponent(title);
    const y = year ? `&year=${year}` : '';
    const apiUrl = `https://api.themoviedb.org/3/search/movie?query=${q}${y}&language=en-US&page=1&include_adult=false`;
    try {
        const res = await fetch(apiUrl, {
            headers: { Authorization: `Bearer ${key}`, accept: 'application/json' },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.error(`[import] TMDB returned ${res.status} for "${title}":`, body.slice(0, 200));
            return null;
        }
        const d = await res.json();
        if (d.results?.length > 0) {
            const hit = d.results[0];
            return {
                tmdbId:    hit.id,
                title:     hit.title,
                year:      hit.release_date ? +hit.release_date.split('-')[0] : null,
                posterUrl: hit.poster_path ? `https://image.tmdb.org/t/p/w342${hit.poster_path}` : null,
            };
        }
        return null;
    } catch (err) {
        console.error(`[import] TMDB fetch error for "${title}":`, err instanceof Error ? err.message : err);
        return null;
    }
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
                // Try with year first, then without, then by slug-derived title
                let hit = await tmdbSearch(film.title, film.year);
                if (!hit && film.year) hit = await tmdbSearch(film.title);
                if (!hit && film.slug !== film.title) {
                    const slugTitle = film.slug.replace(/-/g, ' ');
                    hit = await tmdbSearch(slugTitle, film.year);
                    if (!hit) hit = await tmdbSearch(slugTitle);
                }
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

        console.log(`[import] "${finalTitle}": ${films.length} films scraped, ${added} added, ${notFound} not found`);
        return NextResponse.json({ listId: list.id, title: finalTitle, total: films.length, added, notFound });
    } catch (error) {
        console.error('POST /api/letterboxd-import error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
