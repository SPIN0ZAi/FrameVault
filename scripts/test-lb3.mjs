import https from 'https';

function get(url) {
    return new Promise((res, rej) => {
        const opts = { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/122', 'Accept': 'text/html', 'Accept-Encoding': 'identity', 'Accept-Language': 'en-US,en;q=0.9' } };
        const req = https.get(url, opts, (r) => {
            if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
                return get(r.headers.location).then(res).catch(rej);
            }
            let d = ''; r.on('data', c => d += c); r.on('end', () => res({ status: r.statusCode, html: d }));
        });
        req.on('error', rej);
    });
}

function analyze(html) {
    // All occurrences of data-item-slug
    const slugRe = /data-item-slug="([^"]+)"/g;
    const nameRe = /data-item-name="([^"]+)"/g;
    const slugs = [], names = [];
    let m;
    while ((m = slugRe.exec(html)) !== null) slugs.push(m[1]);
    while ((m = nameRe.exec(html)) !== null) names.push(m[1]);
    
    const uniqueSlugs = [...new Set(slugs)];
    const uniqueNames = [...new Set(names)];
    
    // Pagination  
    const pageRe = /href="([^"]*\/page\/(\d+)\/[^"]*)"/g;
    const pages = new Set();
    while ((m = pageRe.exec(html)) !== null) pages.add(+m[2]);
    const maxPage = pages.size ? Math.max(...pages) : 1;
    
    return { uniqueSlugs, uniqueNames, maxPage };
}

const URLS = [
    'https://letterboxd.com/official/list/2013-highest-rated-films/',
    'https://letterboxd.com/official/list/letterboxd-top-250/',
    'https://letterboxd.com/official/list/official-top-250-narrative-feature-films/',
    'https://letterboxd.com/official/list/every-a24-film/',
];

for (const url of URLS) {
    console.log('\n===', url.split('/').slice(-2, -1)[0], '===');
    try {
        const { status, html } = await get(url);
        console.log('Status:', status);
        if (status === 200) {
            const { uniqueSlugs, uniqueNames, maxPage } = analyze(html);
            console.log('Slugs:', uniqueSlugs.length, '| Max page:', maxPage);
            console.log('First 5:', uniqueSlugs.slice(0, 5).join(', '));
            console.log('Names (first 3):', uniqueNames.slice(0, 3).join(', '));
        }
    } catch(e) {
        console.log('Error:', e.message);
    }
}
