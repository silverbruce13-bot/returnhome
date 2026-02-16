
import fetch from 'node-fetch';
import iconv from 'iconv-lite';

export default async function handler(req, res) {
    // CORS handling
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { book, chapter } = req.query;

    if (!book || !chapter) {
        res.status(400).send('Missing book or chapter');
        return;
    }

    // Book Mapping
    const bookMap = {
        'gen': 1, 'exo': 2, 'lev': 3, 'num': 4, 'deu': 5, 'jos': 6, 'jdg': 7, 'rut': 8, 'sa1': 9, 'sa2': 10,
        'ki1': 11, 'ki2': 12, 'ch1': 13, 'ch2': 14, 'ezr': 15, 'neh': 16, 'est': 17, 'job': 18, 'psa': 19, 'pro': 20,
        'ecc': 21, 'sol': 22, 'isa': 23, 'jer': 24, 'lam': 25, 'eze': 26, 'dan': 27, 'hos': 28, 'joe': 29, 'amo': 30,
        'oba': 31, 'jon': 32, 'mic': 33, 'nah': 34, 'hab': 35, 'zep': 36, 'hag': 37, 'zec': 38, 'mal': 39,
        'mat': 40, 'mar': 41, 'luk': 42, 'joh': 43, 'act': 44, 'rom': 45, 'co1': 46, 'co2': 47, 'gal': 48, 'eph': 49,
        'phi': 50, 'col': 51, 'th1': 52, 'th2': 53, 'ti1': 54, 'ti2': 55, 'tit': 56, 'phm': 57, 'heb': 58, 'jam': 59,
        'pe1': 60, 'pe2': 61, 'jo1': 62, 'jo2': 63, 'jo3': 64, 'jud': 65, 'rev': 66
    };

    const bookStr = Array.isArray(book) ? book[0] : book;
    const chapterStr = Array.isArray(chapter) ? chapter[0] : chapter;

    const bookIndex = bookMap[bookStr?.toLowerCase()];

    if (!bookIndex) {
        res.status(400).send('Invalid book code');
        return;
    }

    // Cache Control - Cache for 24 hours at the edge
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

    try {
        const targetUrl = `http://holybible.or.kr/B_GAE/cgi/bibleftxt.php?VR=GAE&VL=${bookIndex}&CN=${chapterStr}&CV=99`;

        // Fetch
        const response = await fetch(targetUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Decode
        const html = iconv.decode(buffer, 'euc-kr');

        // Parse
        const verses = [];
        // Regex from vite.config.ts
        const verseRegex = /<font[^>]*>\s*<b>\s*(\d+):(\d+)\s*<\/b>\s*<\/font>\s*([^<]+)/g;
        let match;
        let found = false;

        while ((match = verseRegex.exec(html)) !== null) {
            found = true;
            verses.push({
                verse: parseInt(match[2]),
                text: match[3].trim()
            });
        }

        if (!found) {
            // Log but don't fail hard, maybe return empty
            console.warn('No verses found for', bookStr, chapterStr);
        }

        res.status(200).json({ book: bookStr, chapter: chapterStr, verses });

    } catch (error) {
        console.error('Scrape error:', error);
        res.status(500).json({ error: error.message });
    }
}
