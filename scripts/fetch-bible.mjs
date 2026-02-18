/**
 * 성경 본문 스크래핑 & 로컬 저장 스크립트
 * holybible.or.kr에서 개역개정(GAE) 텍스트를 가져와 JSON 파일로 저장합니다.
 * 
 * 사용법: node scripts/fetch-bible.mjs [bookCode] [startChapter] [endChapter]
 * 예시: node scripts/fetch-bible.mjs gal 1 6
 */

import fetch from 'node-fetch';
import iconv from 'iconv-lite';
import fs from 'fs';
import path from 'path';

// 바울 서신서 책 코드 매핑
const bookMap = {
    'rom': { vl: 45, name: '로마서', nameEn: 'Romans', chapters: 16 },
    'co1': { vl: 46, name: '고린도전서', nameEn: '1 Corinthians', chapters: 16 },
    'co2': { vl: 47, name: '고린도후서', nameEn: '2 Corinthians', chapters: 13 },
    'gal': { vl: 48, name: '갈라디아서', nameEn: 'Galatians', chapters: 6 },
    'eph': { vl: 49, name: '에베소서', nameEn: 'Ephesians', chapters: 6 },
    'phi': { vl: 50, name: '빌립보서', nameEn: 'Philippians', chapters: 4 },
    'col': { vl: 51, name: '골로새서', nameEn: 'Colossians', chapters: 4 },
    'th1': { vl: 52, name: '데살로니가전서', nameEn: '1 Thessalonians', chapters: 5 },
    'th2': { vl: 53, name: '데살로니가후서', nameEn: '2 Thessalonians', chapters: 3 },
    'ti1': { vl: 54, name: '디모데전서', nameEn: '1 Timothy', chapters: 6 },
    'ti2': { vl: 55, name: '디모데후서', nameEn: '2 Timothy', chapters: 4 },
    'tit': { vl: 56, name: '디도서', nameEn: 'Titus', chapters: 3 },
    'phm': { vl: 57, name: '빌레몬서', nameEn: 'Philemon', chapters: 1 },
};

async function fetchChapter(bookCode, chapter) {
    const book = bookMap[bookCode];
    if (!book) {
        console.error(`Unknown book code: ${bookCode}`);
        return null;
    }

    const url = `http://www.holybible.or.kr/B_GAE/cgi/bibleftxt.php?VR=GAE&VL=${book.vl}&CN=${chapter}&CV=99`;
    console.log(`  Fetching: ${book.name} ${chapter}장 ...`);

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const html = iconv.decode(buffer, 'euc-kr');

        const verses = [];
        // Match <li><font class=tk4l>...text...</font> pattern
        const verseRegex = /<li>\s*<font class=tk4l>(.*?)<\/font>/gs;
        let match;
        let verseNum = 1;

        while ((match = verseRegex.exec(html)) !== null) {
            // Strip HTML tags (dictionary links) from the verse text
            const cleanText = match[1].replace(/<[^>]*>/g, '').trim();
            if (cleanText) {
                verses.push({
                    verse: verseNum,
                    text: cleanText
                });
                verseNum++;
            }
        }

        if (verses.length === 0) {
            console.warn(`  ⚠️ No verses found for ${book.name} ${chapter}장`);
        } else {
            console.log(`  ✅ ${verses.length} verses fetched`);
        }

        return {
            book: bookCode,
            bookName: book.name,
            bookNameEn: book.nameEn,
            chapter: chapter,
            verses: verses,
            fetchedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error(`  ❌ Error fetching ${book.name} ${chapter}: ${error.message}`);
        return null;
    }
}

async function fetchAndSaveBook(bookCode, startChapter, endChapter) {
    const book = bookMap[bookCode];
    if (!book) {
        console.error(`Unknown book code: ${bookCode}`);
        console.log('Available codes:', Object.keys(bookMap).join(', '));
        process.exit(1);
    }

    const start = startChapter || 1;
    const end = endChapter || book.chapters;

    console.log(`\n📖 ${book.name} (${book.nameEn}) - ${start}장부터 ${end}장까지 가져옵니다...\n`);

    const outputDir = path.resolve(process.cwd(), `data/bible/${bookCode}`);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (let ch = start; ch <= end; ch++) {
        const data = await fetchChapter(bookCode, ch);
        if (data && data.verses.length > 0) {
            const filePath = path.join(outputDir, `${ch}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        }

        // 서버 부하를 줄이기 위한 딜레이 (1초)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ ${book.name} 저장 완료! → ${outputDir}\n`);
}

// CLI 실행
const args = process.argv.slice(2);
const bookCode = args[0] || 'gal';
const startCh = args[1] ? parseInt(args[1]) : undefined;
const endCh = args[2] ? parseInt(args[2]) : undefined;

fetchAndSaveBook(bookCode, startCh, endCh);
