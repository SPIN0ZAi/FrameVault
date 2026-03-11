// Deep inspection of Letterboxd list page structure
const LIST_URL = 'https://letterboxd.com/official/list/2013-highest-rated-films/';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
};

const r = await fetch(LIST_URL, { headers: HEADERS });
const html = await r.text();

// Show a 2000-char section around the first film entry
const idx = html.indexOf('data-target-link="/film/');
console.log('=== Context around first film entry ===');
console.log(html.substring(Math.max(0, idx - 300), idx + 1500));

// Check pagination
console.log('\n=== Pagination ===');
const pageMatches = [...html.matchAll(/href="([^"]+\/page\/\d+\/)"/g)].map(m => m[1]);
console.log('Pagination links:', [...new Set(pageMatches)].slice(0, 5));

const maxPage = Math.max(0, ...[...html.matchAll(/\/page\/(\d+)\//g)].map(m => +m[1]));
console.log('Max page:', maxPage);

// Count unique film slugs
const slugs = [...new Set([...html.matchAll(/data-target-link="\/film\/([^/"]+)\//g)].map(m => m[1]))];
console.log('\nUnique film slugs:', slugs.length);
console.log('Slugs:', slugs.join(', '));
