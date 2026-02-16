
import React, { useState, useMemo, useEffect } from 'react';
import { getReadingForDay, getDefaultDay } from './constants';
import { ActiveTab, DailyReading } from './types';
import BibleReading from './components/BibleReading';
import FaithDiary from './components/FaithDiary';
import EvangelismMission from './components/EvangelismMission';
import MissionMap from './components/MissionMap';
import { useLanguage } from './i18n';
import { GoogleGenAI } from "@google/genai";

console.log("Initializing App.tsx module");

let ai: GoogleGenAI | null = null;
try {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log("API Key present:", !!apiKey);
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("API Key is missing (VITE_GEMINI_API_KEY). AI features will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}

const App: React.FC = () => {
  console.log('App component rendering');
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('reading');
  const [passage, setPassage] = useState<string>('');
  const [headerBg, setHeaderBg] = useState<string | null>(null);

  // Manage the selected day state
  const [selectedDay, setSelectedDay] = useState<number>(() => getDefaultDay(new Date()));

  const today = new Date();
  const dailyReading: DailyReading = useMemo(() => getReadingForDay(selectedDay, language), [selectedDay, language]);

  // Safe localStorage utility to handle QuotaExceededError
  const safeSetItem = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn("Storage quota exceeded in App. Clearing dynamic caches.");
        Object.keys(window.localStorage).forEach(k => {
          if (k.startsWith('reading-cache-') || k.startsWith('header-sketch-') || k.startsWith('journey-map-')) {
            window.localStorage.removeItem(k);
          }
        });
        try {
          window.localStorage.setItem(key, value);
        } catch (retryError) {
          console.error("LocalStorage quota error persisted after clearing.", retryError);
        }
      }
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('appName');

    // Generate Header Background Image
    const generateHeaderBg = async () => {
      if (!ai) return;

      // Changed version to v2 to force update with new distinct silhouette prompt
      const cacheKey = 'header-sketch-bg-v2';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setHeaderBg(cached);
        return;
      }

      try {
        // Prompt updated for clearer silhouettes and higher contrast
        const prompt = "An artistic pencil and ink sketch with vibrant but soft watercolor wash. The central figures are Jesus and a small child walking together, shown as BOLD AND DISTINCT SILHOUETTES with CLEAR OUTLINES. They are walking in a peaceful field during a golden sunset. High contrast between the figures and the warm glowing background. Ethereal, hand-drawn fine art style, minimalist but emotionally evocative.";
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: { aspectRatio: "16:9" }
          }
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (imagePart?.inlineData) {
          const b64 = `data:image/png;base64,${imagePart.inlineData.data}`;
          setHeaderBg(b64);
          safeSetItem(cacheKey, b64);
        }
      } catch (err) {
        console.error("Failed to generate header background", err);
      }
    };

    generateHeaderBg();
  }, [language, t]);

  const todayDateString = today.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const readingRef = `${dailyReading[0].book} ${dailyReading[0].chapter}-${dailyReading[1].chapter}${language === 'ko' ? '장' : ''}`;

  const storageKey = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const NavButton = ({ tab, label }: { tab: ActiveTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-3 px-2 text-sm md:text-base font-semibold transition-colors duration-300 rounded-t-lg relative z-10 ${activeTab === tab
        ? 'bg-slate-800 text-sky-400'
        : 'bg-sky-800/60 text-sky-200 hover:bg-sky-700/80 backdrop-blur-sm'
        }`}
    >
      {label}
    </button>
  );

  const LanguageButton = ({ lang, label }: { lang: 'ko' | 'en', label: string }) => (
    <button
      onClick={() => setLanguage(lang)}
      className={`px-3 py-1 text-xs rounded-md transition-colors ${language === lang ? 'bg-sky-200 text-sky-800 font-bold' : 'bg-transparent text-sky-200 hover:bg-sky-700'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
      <header className="bg-sky-800 text-white shadow-lg sticky top-0 z-20 overflow-hidden border-b border-sky-700/50">
        {/* Sketch Background Layer - Increased opacity and adjusted blending */}
        {headerBg && (
          <div
            className="absolute inset-0 z-0 opacity-70 bg-cover bg-center pointer-events-none transition-opacity duration-1000"
            style={{ backgroundImage: `url(${headerBg})`, mixBlendMode: 'soft-light' }}
          />
        )}
        {/* Subtle Gradient Overlay for Text Visibility - Balanced to show sketch better */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-sky-900/50 via-sky-900/10 to-sky-900/70 pointer-events-none" />

        <div className="container mx-auto px-4 pt-4 pb-2 text-center relative z-10">
          <div className="absolute top-3 left-4 hidden md:block">
            <span className="font-bold text-white tracking-widest text-sm uppercase opacity-80">Live in Wonder</span>
          </div>
          <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
            <div className="flex space-x-1 border border-sky-600 rounded-lg p-0.5 bg-sky-900/40 backdrop-blur-sm">
              <LanguageButton lang="ko" label={t('korean')} />
              <LanguageButton lang="en" label={t('english')} />
            </div>
            <p className="text-xs text-sky-200 font-medium drop-shadow-md text-right bg-sky-900/30 px-2 py-0.5 rounded backdrop-blur-sm">
              {todayDateString}
            </p>
          </div>
          <p className="text-sm md:text-base text-sky-100 font-medium drop-shadow-md">{t('headerSubtitle')}</p>
          <h1 className="text-xl md:text-3xl font-bold mt-1 tracking-wider drop-shadow-lg text-white">
            {t('headerTitle')}
          </h1>

          <div className="mt-1 flex flex-col md:flex-row items-center justify-center gap-2">
            <span className="bg-sky-700/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-sky-200 border border-sky-500/30">
              {t('day', { day: selectedDay })}
            </span>
            <p className="font-semibold text-lg drop-shadow-md">{t('todaysWord')}: {readingRef}</p>
          </div>
        </div>
        <nav className="container mx-auto px-2 md:px-4 flex justify-around mt-4 overflow-x-auto whitespace-nowrap scrollbar-hide relative z-10">
          <NavButton tab="reading" label={t('navReading')} />
          <NavButton tab="diary" label={t('navDiary')} />
          <NavButton tab="mission" label={t('navMission')} />
          <NavButton tab="map" label={t('navMap')} />
        </nav>
      </header>

      <main className="container mx-auto p-4 md:p-6 relative z-10">
        {activeTab === 'reading' && (
          <BibleReading
            reading={dailyReading}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            onPassageLoaded={setPassage}
          />
        )}
        {activeTab === 'diary' && <FaithDiary storageKey={`diary-${storageKey}`} />}
        {activeTab === 'mission' && (passage ? <EvangelismMission passage={passage} storageKey={`mission-${storageKey}`} /> : <div className="text-center p-8 bg-slate-800 rounded-lg">{t('readingFirst')}</div>)}
        {activeTab === 'map' && <MissionMap />}
      </main>

      <footer className="text-center py-6 text-slate-400">
        <p>{t('footer', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
};

export default App;
