
export interface Reading {
  book: string;
  chapter: number;
}

export type DailyReading = [Reading, Reading];

export interface DiaryEntry {
  repentance: string;
  resolve: string;
  dream: string;
}

export interface EvangelismPlan {
  plan: string;
}

export type ActiveTab = 'reading' | 'diary' | 'mission' | 'map';

export interface Song {
  title: string;
  artist: string;
}

export interface SavedDiaryEntry {
  id: number;
  timestamp: string;
  content: DiaryEntry;
}

export interface SavedPlanEntry {
  id: number;
  timestamp: string;
  content: string;
}

export interface ArchivedReading {
  day: number;
  dateSaved: string;
  readingReference: string;
  passage: string;
  meditationGuide: string;
  context: string;
  intention: string;
  contextImageUrl: string | null;
}

export interface JourneyStep {
  city: { ko: string; en: string };
  description: { ko: string; en: string };
  epistles?: { ko: string; en: string }[];
}

export interface MissionJourney {
  id: number;
  title: { ko: string; en: string };
  steps: JourneyStep[];
}

// Added missing PlaceInfoResponse interface
export interface PlaceInfoResponse {
  text: string;
  links: { title: string; uri: string }[];
}

// Added StoryKeywords interface for shared use
export interface StoryKeywords {
  positive: string[];
  sin: string[];
  hope: string[];
}
