import https from 'https';

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity',
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, html: data, headers: res.headers }));
        }).on('error', reject);
    });
}

const URL1 = 'https://letterboxd.com/official/list/official-top-250-narrative-feature-films/';
const URL2 = 'https://letterboxd.com/official/list/2013-highest-rated-films/';

async function analyze(url) {
    console.log('\n--- Testing:', url);
    const { status, html } = await fetchPage(url);
    console.log('Status:', status, '| HTML length:', html.length);
    
    const slugs = [...new Set((html.match(/data-item-slug="([^"]+)"/g) || []).map(m => m.replace(/.*"/, '').replace('"', '')))];
    console.log('Unique slugs:', slugs.length, '| First 3:', slugs.slice(0, 3).join(', '));
    
    // Find page links
    const pageNums = (html.match(/\/page\/(\d+)\//g) || []).map(m => parseInt(m.replace(/\D/g, '')));
    const maxPage = pageNums.length ? Math.max(...pageNums) : 1;
    console.log('Max page:', maxPage);
    
    // Count items
    const items = (html.match(/data-item-slug=/g) || []).length;
    console.log('Total data-item-slug occurrences:', items);
}

await analyze(URL2);
await analyze(URL1);
