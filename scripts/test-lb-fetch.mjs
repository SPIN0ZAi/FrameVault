// Test different approaches to fetch Letterboxd lists
// Run: node scripts/test-lb-fetch.mjs

const LIST_URL = 'https://letterboxd.com/official/list/2013-highest-rated-films/';

const HEADERS_FULL = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
};

async function tryFetch(label, url, headers, opts = {}) {
    try {
        console.log(`\n[${label}] GET ${url}`);
        const r = await fetch(url, { headers, ...opts });
        const html = await r.text();
        const films = (html.match(/data-film-slug="([^"]+)"/g) || []).map(m => m.match(/"([^"]+)"/)[1]);
        const titles = (html.match(/alt="([^"]+)"\s+width="125"/g) || []).map(m => m.match(/"([^"]+)"/)[1]);
        console.log(`  Status: ${r.status}`);
        console.log(`  Films found (slug): ${films.length} | First 3: ${films.slice(0, 3).join(', ')}`);
        console.log(`  Films found (alt):  ${titles.length} | First 3: ${titles.slice(0, 3).join(', ')}`);
        // Check for pagination
        const pages = [...html.matchAll(/href="[^"]+\/page\/(\d+)\/"/g)].map(m => +m[1]);
        if (pages.length) console.log(`  Max page: ${Math.max(...pages)}`);
        return { status: r.status, films, cookies: r.headers.get('set-cookie') };
    } catch (e) {
        console.log(`  ERROR: ${e.message}`);
        return { status: 0, films: [], cookies: null };
    }
}

async function main() {
    console.log('=== Testing Letterboxd fetch approaches ===\n');

    // Test 1: regular list page
    const r1 = await tryFetch('1. Regular page (no detail)', LIST_URL, HEADERS_FULL);

    // Test 2: detail page (what we currently use)
    await tryFetch('2. Detail page (current approach)', LIST_URL + 'detail/', HEADERS_FULL);

    // Test 3: regular page with referer
    await tryFetch('3. Regular + Referer', LIST_URL, {
        ...HEADERS_FULL,
        'Referer': 'https://letterboxd.com/',
    });

    // Test 4: minimal headers
    await tryFetch('4. Minimal headers', LIST_URL, {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    });

    // Test 5: page 2 with cookies from page 1
    if (r1.cookies && r1.films.length > 0) {
        await tryFetch('5. Page 2 with cookies', LIST_URL + 'page/2/', {
            ...HEADERS_FULL,
            'Cookie': r1.cookies,
            'Referer': LIST_URL,
        });
    }

    console.log('\n=== Done ===');
}

main().catch(console.error);
