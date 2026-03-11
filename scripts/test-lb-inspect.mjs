// Inspect the actual HTML structure from Letterboxd
const LIST_URL = 'https://letterboxd.com/official/list/2013-highest-rated-films/';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
};

const r = await fetch(LIST_URL, { headers: HEADERS });
const html = await r.text();

console.log('Status:', r.status);
console.log('HTML length:', html.length);

// Try multiple slug patterns
const patterns = [
    /data-film-slug="([^"]+)"/g,
    /data-target-link="\/film\/([^/"]+)\//g,
    /data-film-link="([^"]+)"/g,
    /class="film-poster[^>]+data-film-slug="([^"]+)"/g,
    /<div[^>]+data-film-slug="([^"]+)"/g,
];

for (const pat of patterns) {
    const matches = [...html.matchAll(pat)].map(m => m[1]);
    if (matches.length) {
        console.log(`Pattern ${pat.source.substring(0, 30)}: ${matches.length} hits — first 3: ${matches.slice(0, 3).join(', ')}`);
    }
}

// Show a chunk around likely film data
const idx = html.indexOf('poster-container');
if (idx !== -1) {
    console.log('\n--- around poster-container ---');
    console.log(html.substring(Math.max(0, idx - 100), idx + 600));
} else {
    console.log('\nNo "poster-container" found');
    // Show first occurrence of "film"
    const filmIdx = html.toLowerCase().indexOf('film');
    console.log('\n--- first "film" occurrence ---');
    console.log(html.substring(Math.max(0, filmIdx - 50), filmIdx + 300));
    
    // Show meta tags
    const ogTitle = html.match(/<meta[^>]+og:title[^>]+>/);
    console.log('\nOG title tag:', ogTitle?.[0]);
}

// Check for script tags with JSON data
const scriptMatches = [...html.matchAll(/<script[^>]*>([^<]{50,})<\/script>/g)];
for (const m of scriptMatches.slice(0, 3)) {
    if (m[1].includes('film') || m[1].includes('slug')) {
        console.log('\nScript with film data:', m[1].substring(0, 300));
    }
}
