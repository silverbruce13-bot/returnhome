
import { Reading, DailyReading } from './types';
import { Language } from './i18n';

export const PAULINE_EPISTLES = [
  { book: { ko: '갈라디아서', en: 'Galatians' }, chapters: 6 },
  { book: { ko: '데살로니가전서', en: '1 Thessalonians' }, chapters: 5 },
  { book: { ko: '데살로니가후서', en: '2 Thessalonians' }, chapters: 3 },
  { book: { ko: '고린도전서', en: '1 Corinthians' }, chapters: 16 },
  { book: { ko: '고린도후서', en: '2 Corinthians' }, chapters: 13 },
  { book: { ko: '로마서', en: 'Romans' }, chapters: 16 },
  { book: { ko: '골로새서', en: 'Colossians' }, chapters: 4 },
  { book: { ko: '빌레몬서', en: 'Philemon' }, chapters: 1 },
  { book: { ko: '에베소서', en: 'Ephesians' }, chapters: 6 },
  { book: { ko: '빌립보서', en: 'Philippians' }, chapters: 4 },
  { book: { ko: '디모데전서', en: '1 Timothy' }, chapters: 6 },
  { book: { ko: '디도서', en: 'Titus' }, chapters: 3 },
  { book: { ko: '디모데후서', en: '2 Timothy' }, chapters: 4 },
];

type ReadingPlanItem = {
    book: { ko: string; en: string };
    chapter: number;
}

const generateReadingPlan = (): ReadingPlanItem[] => {
  const plan: ReadingPlanItem[] = [];
  PAULINE_EPISTLES.forEach(({ book, chapters }) => {
    for (let i = 1; i <= chapters; i++) {
      plan.push({ book, chapter: i });
    }
  });
  return plan;
};

export const readingPlan = generateReadingPlan();
const totalChapters = readingPlan.length;

/**
 * 로마서 10장은 전체 장 중 53번째 장(인덱스 52)입니다.
 * 하루 2장씩 읽을 때, Day 27이 53-54장(로마서 10-11장)이 됩니다.
 * 현재 날짜가 Day 27이 되도록 시작 날짜를 오늘 기준으로 26일 전으로 조정합니다.
 */
const getAdjustedStartDate = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const startDate = new Date(now.getTime() - (26 * 24 * 60 * 60 * 1000));
  return startDate;
};

export const SCHEDULE_START_DATE = getAdjustedStartDate();

export const getDefaultDay = (date: Date): number => {
  const oneDay = 1000 * 60 * 60 * 24;
  const currentDate = new Date(date);
  currentDate.setHours(0,0,0,0);

  let dayOfSchedule = Math.floor((currentDate.getTime() - SCHEDULE_START_DATE.getTime()) / oneDay);

  if (dayOfSchedule < 0) {
      dayOfSchedule = 0;
  }
  
  const totalDays = Math.ceil(totalChapters / 2);
  return (dayOfSchedule % totalDays) + 1;
};

export const getReadingForDay = (day: number, language: Language): DailyReading => {
  const dayIndex = day - 1;
  const startIndex = (dayIndex * 2) % totalChapters;
  
  const firstChapterItem = readingPlan[startIndex];
  const secondChapterItem = readingPlan[(startIndex + 1) % totalChapters];

  return [
    { book: firstChapterItem.book[language], chapter: firstChapterItem.chapter },
    { book: secondChapterItem.book[language], chapter: secondChapterItem.chapter },
  ];
};

export interface ScheduleItem {
  day: number;
  reading: string;
}

export const getFullSchedule = (language: Language): ScheduleItem[] => {
    const schedule: ScheduleItem[] = [];
    const totalDays = Math.ceil(readingPlan.length / 2);

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
        const startIndex = dayIndex * 2;
        const firstChapter = readingPlan[startIndex];
        const secondChapter = readingPlan[startIndex + 1];

        let readingText: string;

        const firstBookName = firstChapter.book[language];

        if (!secondChapter) {
            readingText = language === 'ko' ? `${firstBookName} ${firstChapter.chapter}장` : `${firstBookName} ${firstChapter.chapter}`;
        } else {
            const secondBookName = secondChapter.book[language];
            if (firstBookName === secondBookName) {
                readingText = language === 'ko' 
                    ? `${firstBookName} ${firstChapter.chapter}-${secondChapter.chapter}장` 
                    : `${firstBookName} ${firstChapter.chapter}-${secondChapter.chapter}`;
            } else {
                const firstReading = language === 'ko' ? `${firstBookName} ${firstChapter.chapter}장` : `${firstBookName} ${firstChapter.chapter}`;
                const secondReading = language === 'ko' ? `${secondBookName} ${secondChapter.chapter}장` : `${secondBookName} ${secondChapter.chapter}`;
                readingText = `${firstReading} & ${secondReading}`;
            }
        }
        
        schedule.push({
            day: dayIndex + 1,
            reading: readingText,
        });
    }
    return schedule;
};
