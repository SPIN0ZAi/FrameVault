const HEADERS = { 'User-Agent': 'Mozilla/5.0 Chrome/122.0', 'Accept': 'text/html,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9', 'Accept-Encoding': 'identity' };
const r = await fetch('https://letterboxd.com/official/list/official-top-250-narrative-feature-films/', { headers: HEADERS });
const html = await r.text();
const slugs = [...new Set([...html.matchAll(/data-item-slug="([^"]+)"/g)].map(m => m[1]))];
console.log('Status:', r.status, '| Slugs on page:', slugs.length, '| First 3:', slugs.slice(0,3).join(', '));
const pagLinks = [...new Set([...html.matchAll(/href="([^"]*page\/\d+[^"]*)"/g)].map(m => m[1]))];
console.log('Pagination links:', pagLinks.slice(0, 5));
const maxPg = Math.max(0, ...[...html.matchAll(/\/page\/(\d+)\//g)].map(m => +m[1]));
console.log('Max page in href:', maxPg);
// Check li.posteritem count
const items = (html.match(/class="posteritem/g) || []).length;
console.log('posteritem count:', items);
