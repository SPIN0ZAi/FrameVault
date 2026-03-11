import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Allow up to 60 s on Vercel Pro / long-running environments
export const maxDuration = 60;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';

// ─── HTML helpers ────────────────────────────────────────────────────────────

function decodeEntities(s: string) {
    return s
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
        .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

interface LbFilm { slug: string; title: string; year?: number }

function extractFilms(html: string): LbFilm[] {
    const films: LbFilm[] = [];
    const seen = new Set<string>();

    // Split into per-film blocks at each <li class="poster-container"
    const blocks = html.split('<li class="poster-container"').slice(1);

    for (const block of blocks) {
        // Slug lives on the <div class="film-poster" data-film-slug="...">
        const slug = block.match(/data-film-slug="([^"]+)"/)?.[1];
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);

        // Title — prefer the visible entry title, fall back to img alt
        const entryTitle = block.match(/<p[^>]*class="[^"]*list-entry-title[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/)?.[1];
        const altTitle   = block.match(/<img[^>]+alt="([^"]+)"/)?.[1];
        const title = decodeEntities((entryTitle || altTitle || slug.replace(/-/g, ' ')).trim());

        // Year — explicit <p class="list-entry-year"> or trailing -YYYY in slug
        const yearTag  = block.match(/<p[^>]*class="[^"]*list-entry-year[^"]*"[^>]*>(\d{4})<\/p>/)?.[1];
        const yearSlug = slug.match(/-(\d{4})$/)?.[1];
        const year = yearTag ? +yearTag : (yearSlug ? +yearSlug : undefined);

        films.push({ slug, title, year });
    }
    return films;
}

function extractMaxPage(html: string): number {
    const nums = [...html.matchAll(/href="[^"]+\/page\/(\d+)\/"/g)].map(m => +m[1]);
    return nums.length ? Math.max(...nums) : 1;
}

function extractListTitle(html: string): string {
    const og = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1]
            || html.match(/<meta content="([^"]+)" property="og:title"/)?.[1];
    if (og) return decodeEntities(og.replace(/\s*[|·—–].*$/, '').trim());
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, '').trim();
    return h1 ? decodeEntities(h1) : 'Imported List';
}

async function fetchPage(url: string): Promise<string> {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!res.ok) throw new Error(`Letterboxd returned HTTP ${res.status} for ${url}`);
    return res.text();
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

async function scrapeList(rawUrl: string): Promise<{ films: LbFilm[]; listTitle: string; listUrl: string }> {
    let url = rawUrl.trim().replace(/\/+$/, '');
    if (!url.startsWith('http')) url = `https://${url}`;

    // Follow boxd.it short links
    if (url.includes('boxd.it')) {
        const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
        url = r.url.replace(/\/+$/, '');
    }

    // Validate: must be a list URL
    if (!url.includes('letterboxd.com') || (!url.includes('/list/') && !url.includes('letterboxd.com/'))) {
        throw new Error('URL does not look like a Letterboxd list. Use a URL like https://letterboxd.com/username/list/slug/');
    }

    // If it's a watchlist URL, handle it similarly
    const detailBase = url.includes('/list/')
        ? `${url}/detail/`
        : `${url}/detail/`;

    const firstHtml = await fetchPage(detailBase);
    const listTitle = extractListTitle(firstHtml);
    const maxPage   = extractMaxPage(firstHtml);
    const allFilms  = extractFilms(firstHtml);

    // Fetch remaining pages in parallel (max 5 at a time)
    const remaining = Array.from({ length: maxPage - 1 }, (_, i) => i + 2);
    const CONCURRENCY = 5;
    for (let i = 0; i < remaining.length; i += CONCURRENCY) {
        const batch = remaining.slice(i, i + CONCURRENCY);
        const pages = await Promise.all(batch.map(p => fetchPage(`${detailBase}page/${p}/`)));
        for (const html of pages) allFilms.push(...extractFilms(html));
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
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${q}${y}&language=en-US&page=1`;
    try {
        const r = await fetch(url);
        const d = await r.json();
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

        // ── 1. Scrape Letterboxd ──────────────────────────────────────────────
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

        // ── 2. Create the List ────────────────────────────────────────────────
        const finalTitle = customTitle?.trim() || listTitle;
        const list = await prisma.list.create({
            data: {
                userId:      session.user.id,
                title:       finalTitle,
                description: `Imported from Letterboxd: ${listUrl}`,
                isPublic:    true,
            },
        });

        // ── 3. TMDB search + DB insert (parallel batches of 20) ───────────────
        const BATCH = 20;
        let added = 0, notFound = 0;

        for (let i = 0; i < films.length; i += BATCH) {
            const batch = films.slice(i, i + BATCH);

            const resolved = await Promise.all(batch.map(async (film, bi) => {
                let hit = await tmdbSearch(film.title, film.year);
                if (!hit && film.year) hit = await tmdbSearch(film.title); // retry without year
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
