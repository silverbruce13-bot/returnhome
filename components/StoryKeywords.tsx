
import React, { useState, useEffect, useCallback } from 'react';
import { generateStoryKeywords } from '../services/geminiService';
// Fix: Import StoryKeywords from types.ts
import { StoryKeywords } from '../types';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { useLanguage } from '../i18n';

interface StoryKeywordsProps {
  passage: string;
}

const StoryKeywordsComponent: React.FC<StoryKeywordsProps> = ({ passage }) => {
  const { language, t } = useLanguage();
  const [keywords, setKeywords] = useState<StoryKeywords | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline] = useState(() => navigator.onLine);

  const fetchKeywords = useCallback(async () => {
    if (!passage || !isOnline) {
      if (!isOnline) setError(t('offlineError'));
      setIsLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `story-keywords-${today}-${language}`;

    try {
      const cachedData = window.localStorage.getItem(cacheKey);
      if (cachedData) {
        setKeywords(JSON.parse(cachedData));
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error("Failed to read story keywords from cache", e);
    }

    setIsLoading(true);
    setError(null);
    try {
      const generatedKeywords = await generateStoryKeywords(passage, language);
      if (generatedKeywords) {
        setKeywords(generatedKeywords);
        window.localStorage.setItem(cacheKey, JSON.stringify(generatedKeywords));
      } else {
        throw new Error("No keywords returned from API");
      }
    } catch (err) {
      console.error(err);
      setError(t('keywordsApiError'));
    } finally {
      setIsLoading(false);
    }
  }, [passage, language, t, isOnline]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const KeywordTag: React.FC<{ children: React.ReactNode; color: 'yellow' | 'pink' | 'green' }> = ({ children, color }) => {
    const colors = {
      yellow: 'bg-yellow-300/80 text-yellow-900',
      pink: 'bg-pink-300/80 text-pink-900',
      green: 'bg-green-300/80 text-green-900',
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${colors[color]}`}>
        {children}
      </span>
    );
  };

  const KeywordSection: React.FC<{ title: string; keywords: string[]; color: 'yellow' | 'pink' | 'green' }> = ({ title, keywords, color }) => {
    if (!keywords || keywords.length === 0) return null;
    return (
      <div>
        <h3 className="font-semibold text-slate-300 mb-2">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, index) => (
            <KeywordTag key={index} color={color}>{kw}</KeywordTag>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block mr-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 0 1 0 2.828l-7 7a2 2 0 0 1-2.828 0l-7-7A2 2 0 0 1 3 12V7a4 4 0 0 1 4-4z" />
        </svg>
        <span>{t('storyKeywordsTitle')}</span>
      </h2>

      {isLoading && <Spinner message={t('generatingKeywords')} />}
      {error && <p className="text-red-400 text-center mt-4 p-2 bg-red-500/10 rounded-lg">{error}</p>}

      {!isLoading && keywords && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KeywordSection title={t('positiveMode')} keywords={keywords.positive} color="yellow" />
          <KeywordSection title={t('sinMode')} keywords={keywords.sin} color="pink" />
          <KeywordSection title={t('hopeMode')} keywords={keywords.hope} color="green" />
        </div>
      )}
    </Card>
  );
};

export default StoryKeywordsComponent;
