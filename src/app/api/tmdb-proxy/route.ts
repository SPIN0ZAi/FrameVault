import { NextRequest, NextResponse } from 'next/server';

// GET /api/tmdb-proxy?url=<encoded tmdb url>
// Proxies TMDB requests server-side so the API key is never exposed
export async function GET(req: NextRequest) {
    const raw = req.nextUrl.searchParams.get('url');
    if (!raw) return NextResponse.json({ error: 'url param required' }, { status: 400 });

    const allowed = /^https:\/\/api\.themoviedb\.org\/3\//;
    if (!allowed.test(raw)) return NextResponse.json({ error: 'Invalid url' }, { status: 400 });

    const key = process.env.TMDB_API_KEY;
    if (!key) return NextResponse.json({ error: 'TMDB key not configured' }, { status: 500 });

    try {
        const res = await fetch(raw, {
            headers: { Authorization: `Bearer ${key}`, accept: 'application/json' },
            signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error('[tmdb-proxy] error:', err);
        return NextResponse.json({ error: 'TMDB fetch failed' }, { status: 500 });
    }
}
