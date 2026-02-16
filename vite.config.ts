import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/bible': {
          target: 'http://holybible.or.kr',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/bible/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // This is where we would ideally intercept and serve from cache
              // blocked by proxy limitation with simple config.
              // We will use a custom middleware instead below.
            });
          }
        }
      }
    },
    plugins: [
      react(),
      {
        name: 'bible-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/scrape-bible', async (req, res, next) => {
            try {
              const url = new URL(req.url || '', `http://${req.headers.host}`);
              const book = url.searchParams.get('book'); // e.g., 'rom', 'gen'
              const chapter = url.searchParams.get('chapter'); // e.g., '1'

              if (!book || !chapter) {
                res.statusCode = 400;
                res.end('Missing book or chapter');
                return;
              }

              // 1. Check Cache
              const cacheDir = path.resolve(__dirname, 'public/data/bible');
              const cacheFile = path.join(cacheDir, `${book}_${chapter}.json`);

              // Ensure cache dir exists
              if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
              }

              if (fs.existsSync(cacheFile)) {
                const cachedData = fs.readFileSync(cacheFile, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(cachedData);
                return;
              }

              // 2. Fetch from HolyBible.or.kr (using their specific query params)
              // We need a mapping from our book codes (rom) to their indices (45 for Romans)
              // For now, let's assume the frontend sends the mapping or we map it here.
              // Actually, bskorea uses 'rom', holybible uses numbers. 
              // Let's use bskorea as it's cleaner if possible, but earlier test showed we might need specific scraping.

              // Let's look at the implementation plan again: "Fetch from holybible.or.kr".
              // HolyBible uses numbers: Gen=1 ... Rom=45.
              // We need a map. 

              const bookMap: Record<string, number> = {
                'gen': 1, 'exo': 2, 'lev': 3, 'num': 4, 'deu': 5, 'jos': 6, 'jdg': 7, 'rut': 8, 'sa1': 9, 'sa2': 10,
                'ki1': 11, 'ki2': 12, 'ch1': 13, 'ch2': 14, 'ezr': 15, 'neh': 16, 'est': 17, 'job': 18, 'psa': 19, 'pro': 20,
                'ecc': 21, 'sol': 22, 'isa': 23, 'jer': 24, 'lam': 25, 'eze': 26, 'dan': 27, 'hos': 28, 'joe': 29, 'amo': 30,
                'oba': 31, 'jon': 32, 'mic': 33, 'nah': 34, 'hab': 35, 'zep': 36, 'hag': 37, 'zec': 38, 'mal': 39,
                'mat': 40, 'mar': 41, 'luk': 42, 'joh': 43, 'act': 44, 'rom': 45, 'co1': 46, 'co2': 47, 'gal': 48, 'eph': 49,
                'phi': 50, 'col': 51, 'th1': 52, 'th2': 53, 'ti1': 54, 'ti2': 55, 'tit': 56, 'phm': 57, 'heb': 58, 'jam': 59,
                'pe1': 60, 'pe2': 61, 'jo1': 62, 'jo2': 63, 'jo3': 64, 'jud': 65, 'rev': 66
              };

              const bookIndex = bookMap[book.toLowerCase()];

              if (!bookIndex) {
                res.statusCode = 400;
                res.end('Invalid book code');
                return;
              }

              // HolyBible URL: http://holybible.or.kr/B_GAE/cgi/bibleftxt.php?VR=GAE&VL=45&CN=1&CV=99
              const targetUrl = `http://holybible.or.kr/B_GAE/cgi/bibleftxt.php?VR=GAE&VL=${bookIndex}&CN=${chapter}&CV=99`;

              const fetch = (await import('node-fetch')).default;
              // @ts-ignore
              const response = await fetch(targetUrl);
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              // HolyBible might be EUC-KR. We need to decode it.
              const iconv = await import('iconv-lite');
              const html = iconv.default.decode(buffer, 'euc-kr');

              // 3. Parse HTML
              // Simple regex to extract verses: <br><b>1:1</b> Verse text...
              // Structure is usually: <br> <font ...> <b> 1:1 </b> </font>  Text ... <br>

              const verses = [];
              // This regex is a heuristic.
              const regex = /(\d+):(\d+)\s*<\/b>\s*<\/font>\s*(.*?)(?=<br>|<table|$)/g;

              // Better approach for holybible.or.kr based on prior knowledge:
              // content is often in <td> or directly in body.
              // It often looks like:  <br> <font color=blue> <b> 12:1 </b> </font>  그러므로 형제들아 ...

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
                // Fallback or error log
                console.log('No verses found via regex. saving raw HTML for debug.');
                // fs.writeFileSync('debug_bible.html', html);
              }

              const result = {
                book,
                chapter: parseInt(chapter),
                verses
              };

              // 4. Save to Cache
              fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));

            } catch (e) {
              console.error(e);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.toString() }));
            }
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
