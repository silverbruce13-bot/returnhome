
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DailyReading, ArchivedReading } from '../types';
import { generateComprehensiveReadingContent, generateContextImage, explainPassageSelection } from '../services/geminiService';
import { readingPlan, getFullSchedule } from '../constants';
import { getMeditationStatus, saveMeditationStatus, MeditationRecord, MeditationStatus, getArchivedReadings, saveArchivedReading } from '../services/syncService';
import Card from './common/Card';
import Spinner from './common/Spinner';
import MusicRecommendation from './MusicRecommendation';
import PrayerTraining from './PrayerTraining';
import SermonOutline from './SermonOutline';
import BibleChat from './BibleChat';
import StoryKeywords from './StoryKeywords';
import ArchivedReadingModal from './ArchivedReadingModal';
import ExplanationModal from './ExplanationModal';
import { useLanguage } from '../i18n';

interface BibleReadingProps {
  reading: DailyReading;
  selectedDay: number;
  onDayChange: (day: number) => void;
  onPassageLoaded: (passage: string) => void;
}

interface CachedReadingData {
  passage: string;
  meditationGuide: string;
  context: string;
  intention: string;
  imagePrompt: string;
  contextImageUrl: string | null;
}

const BibleReading: React.FC<BibleReadingProps> = ({ reading, selectedDay, onDayChange, onPassageLoaded }) => {
  console.log('BibleReading rendering', { reading, selectedDay });
  const { language, t } = useLanguage();
  const [passage, setPassage] = useState<string>('');
  const [passageIntention, setPassageIntention] = useState<string>('');
  const [meditationGuide, setMeditationGuide] = useState<string>('');
  const [passageContext, setPassageContext] = useState<string>('');
  const [contextImageUrl, setContextImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPassageCopied, setIsPassageCopied] = useState<boolean>(false);
  const [isTocVisible, setIsTocVisible] = useState(false);
  const [meditationStatus, setMeditationStatus] = useState<MeditationRecord>({});
  const [isSaving, setIsSaving] = useState(false);
  const [archivedReadings, setArchivedReadings] = useState<Record<number, ArchivedReading>>({});
  const [viewingArchivedDay, setViewingArchivedDay] = useState<number | null>(null);

  const passageContainerRef = useRef<HTMLDivElement>(null);
  const [selectionPopover, setSelectionPopover] = useState({ visible: false, x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [explanationModal, setExplanationModal] = useState({
    isOpen: false,
    isLoading: false,
    error: null as string | null,
    content: '',
  });

  const fullSchedule = useMemo(() => getFullSchedule(language), [language]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [status, archives] = await Promise.all([
          getMeditationStatus(),
          getArchivedReadings()
        ]);
        setMeditationStatus(status);
        setArchivedReadings(archives);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  const totalDays = useMemo(() => Math.ceil(readingPlan.length / 2), []);

  const handleStatusChange = async (day: number, status: MeditationStatus) => {
    const newStatus = { ...meditationStatus };
    if (newStatus[day] === status) {
      delete newStatus[day];
    } else {
      newStatus[day] = status;
    }
    setMeditationStatus(newStatus);

    try {
      await saveMeditationStatus(newStatus);
    } catch (error) {
      console.error("Failed to save meditation status:", error);
    }
  };

  const handleCompleteReading = async () => {
    if (!passage || !meditationGuide) return;
    setIsSaving(true);

    const readingReference = `${reading[0].book} ${reading[0].chapter}-${reading[1].chapter}`;

    const dataToArchive: ArchivedReading = {
      day: selectedDay,
      dateSaved: new Date().toISOString(),
      readingReference,
      passage,
      meditationGuide,
      context: passageContext,
      intention: passageIntention,
      contextImageUrl,
    };

    try {
      await saveArchivedReading(selectedDay, dataToArchive);
      setArchivedReadings(prev => ({ ...prev, [selectedDay]: dataToArchive }));
      // Automatically mark as 'good'
      if (meditationStatus[selectedDay] !== 'good') {
        handleStatusChange(selectedDay, 'good');
      }
    } catch (error) {
      console.error("Failed to save archived reading:", error);
    } finally {
      setTimeout(() => setIsSaving(false), 2000);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.match(/^\d+\./) || line.match(/^\d+:/) || line.match(/^\d+\s/)) {
        return <p key={index} className="mb-2"><span className="font-semibold text-sky-400 mr-2">{line.split(' ')[0]}</span>{line.substring(line.indexOf(' ') + 1)}</p>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={index} className="text-xl font-bold text-slate-200 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>
      }
      return <p key={index} className="mb-2">{line}</p>;
    });
  };

  const handleCopy = (textToCopy: string, setCopiedState: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000);
      })
      .catch(err => {
        console.error('Clipboard copy failed:', err);
        alert(t('copyFailed'));
      });
  };

  const handleMouseUp = () => {
    if (!passageContainerRef.current) return;

    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 5 && passageContainerRef.current.contains(selection.anchorNode)) {
      const selected = selection.toString().trim();
      setSelectedText(selected);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = passageContainerRef.current.getBoundingClientRect();

      setSelectionPopover({
        visible: true,
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
      });
    } else {
      setSelectionPopover({ visible: false, x: 0, y: 0 });
    }
  };

  const handleExplainClick = async () => {
    if (!selectedText) return;

    setSelectionPopover({ visible: false, x: 0, y: 0 });
    setExplanationModal({ isOpen: true, isLoading: true, error: null, content: '' });

    try {
      const result = await explainPassageSelection(selectedText, passage, language);
      setExplanationModal({ isOpen: true, isLoading: false, error: null, content: result });
    } catch (err) {
      console.error(err);
      setExplanationModal({
        isOpen: true,
        isLoading: false,
        error: t('explanationApiError'),
        content: ''
      });
    }
  };

  const closeExplanationModal = () => {
    setExplanationModal({ isOpen: false, isLoading: false, error: null, content: '' });
    setSelectedText('');
  };

  // Safe localStorage utility to handle QuotaExceededError
  const safeSetItem = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn("Storage quota exceeded. Clearing old caches to make room.");
        // Clear all dynamic AI generated content caches (base64 images are large)
        Object.keys(window.localStorage).forEach(k => {
          if (k.startsWith('reading-cache-') || k.startsWith('header-sketch-') || k.startsWith('journey-map-')) {
            window.localStorage.removeItem(k);
          }
        });
        // Try setting it again after clearing
        try {
          window.localStorage.setItem(key, value);
        } catch (retryError) {
          console.error("LocalStorage still full even after clearing caches.", retryError);
        }
      }
    }
  };

  const fetchContent = useCallback(async () => {
    if (!reading || reading.length < 2) return;

    // Cache content per day and language
    const cacheKey = `reading-cache-day-${selectedDay}-${language}`;

    try {
      const cachedItem = window.localStorage.getItem(cacheKey);
      if (cachedItem) {
        const cachedData: CachedReadingData = JSON.parse(cachedItem);
        setPassage(cachedData.passage);
        onPassageLoaded(cachedData.passage);
        setMeditationGuide(cachedData.meditationGuide);
        setPassageContext(cachedData.context);
        setPassageIntention(cachedData.intention);
        setContextImageUrl(cachedData.contextImageUrl);
        setIsLoading(false);
        setIsImageLoading(false);
        return;
      }
    } catch (e) {
      console.error("Failed to read from cache", e);
    }

    setIsLoading(true);
    setError(null);
    setContextImageUrl(null);
    setIsImageLoading(false);
    try {
      const comprehensiveData = await generateComprehensiveReadingContent(reading[0].book, reading[0].chapter, reading[1].chapter, language);

      if (!comprehensiveData) {
        throw new Error("Failed to get data from API.");
      }

      setPassage(comprehensiveData.passage);
      onPassageLoaded(comprehensiveData.passage);
      setMeditationGuide(comprehensiveData.meditationGuide);
      setPassageContext(comprehensiveData.context);
      setPassageIntention(comprehensiveData.intention);
      setIsLoading(false);

      setIsImageLoading(true);
      let imageUrl: string | null = null;
      if (comprehensiveData.imagePrompt) {
        imageUrl = await generateContextImage({
          initialPrompt: comprehensiveData.imagePrompt,
          fallbackContext: comprehensiveData.intention,
          language: language,
        });
        setContextImageUrl(imageUrl);
      }
      setIsImageLoading(false);

      const dataToCache: CachedReadingData = {
        ...comprehensiveData,
        contextImageUrl: imageUrl,
      };
      safeSetItem(cacheKey, JSON.stringify(dataToCache));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        setError(t('apiQuotaExceeded'));
      } else {
        setError(t('contentError'));
      }
      console.error(err);
      setIsLoading(false);
      setIsImageLoading(false);
    }
  }, [reading, selectedDay, onPassageLoaded, language, t]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const readingPlanInfoParts = t('readingPlanInfo').split(/\{(\w+)\}/);
  const isTodayArchived = !!archivedReadings[selectedDay];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100">{t('readingPlanTitle')}</h2>
          <button
            onClick={() => setIsTocVisible(!isTocVisible)}
            className="flex items-center px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
          >
            {isTocVisible ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                <span>{t('hideButton')}</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span>{t('showAllButton')}</span>
              </>
            )}
          </button>
        </div>
        {isTocVisible && (
          <div className="mt-4 border-t border-slate-700 pt-4">
            <p className="text-sm text-slate-400 mb-2">
              {readingPlanInfoParts.map((part, i) => {
                if (part === 'totalDays') return <strong key={i} className="text-sky-400">{totalDays}</strong>;
                if (part === 'currentDay') return <strong key={i} className="text-sky-400">{selectedDay}</strong>;
                return <span key={i}>{part}</span>
              })}
            </p>
            <div className="text-sm text-slate-400 mb-3 p-2 bg-slate-900 rounded-md border border-slate-700">
              <strong>{t('meditationRecordGuide')}</strong> {t('meditationRecordInstruction')}
              <br />
              <span className="font-semibold text-green-400">{t('meditationGood').split(': ')[0]}:</span> {t('meditationGood').split(': ')[1]},{' '}
              <span className="font-semibold text-amber-400">{t('meditationOk').split(': ')[0]}:</span> {t('meditationOk').split(': ')[1]},{' '}
              <span className="font-semibold text-red-400">{t('meditationBad').split(': ')[0]}:</span> {t('meditationBad').split(': ')[1]}
            </div>
            <div className="max-h-80 overflow-y-auto pr-2">
              <ul className="space-y-1">
                {fullSchedule.map(item => {
                  const status = meditationStatus[item.day];
                  const isArchived = !!archivedReadings[item.day];
                  const isSelected = item.day === selectedDay;

                  const liClasses = ['p-2 rounded-md transition-all text-sm flex justify-between items-center group'];

                  if (status === 'good') liClasses.push('bg-green-500/10 text-green-400 border border-green-500/20');
                  else if (status === 'ok') liClasses.push('bg-amber-500/10 text-amber-400 border border-amber-500/20');
                  else if (status === 'bad') liClasses.push('bg-red-500/10 text-red-400 border border-red-500/20');
                  else if (isSelected) liClasses.push('bg-sky-500/10 text-sky-400 font-bold border border-sky-500/30');
                  else liClasses.push('text-slate-300 border border-transparent');

                  if (isSelected) liClasses.push('ring-2 ring-sky-400');

                  return (
                    <li key={item.day} className={liClasses.join(' ')}>
                      <div className="flex items-center flex-grow overflow-hidden">
                        <span className="font-mono mr-3 text-slate-500 w-16 inline-block flex-shrink-0">{t('day', { day: item.day })}:</span>
                        <span className="truncate">{item.reading}</span>
                        <div className="ml-2 flex space-x-2">
                          {!isSelected && (
                            <button
                              onClick={() => onDayChange(item.day)}
                              className="px-2 py-0.5 text-[10px] bg-sky-600/20 text-sky-400 border border-sky-400/30 rounded hover:bg-sky-600 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 opacity-0 group-hover:opacity-100"
                              title={t('jumpToDay')}
                            >
                              {t('jumpToDay')}
                            </button>
                          )}
                          {isArchived && (
                            <button
                              onClick={() => setViewingArchivedDay(item.day)}
                              className="px-2 py-0.5 text-[10px] bg-slate-600 text-slate-300 rounded hover:bg-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
                              title={t('reviewButton')}
                            >
                              {t('reviewButton')}
                            </button>
                          )}
                          {isSelected && (
                            <span className="px-2 py-0.5 text-[10px] bg-sky-500 text-white rounded font-bold flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {t('currentReadingMark')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                        <button
                          title={t('meditationGoodTooltip')}
                          onClick={() => handleStatusChange(item.day, 'good')}
                          className={`w-5 h-5 rounded-full transition-colors hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${status === 'good' ? 'bg-green-500 ring-green-400' : 'bg-slate-600 hover:bg-green-500 ring-transparent'}`}
                          aria-pressed={status === 'good'}
                        />
                        <button
                          title={t('meditationOkTooltip')}
                          onClick={() => handleStatusChange(item.day, 'ok')}
                          className={`w-5 h-5 rounded-full transition-colors hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${status === 'ok' ? 'bg-amber-500 ring-amber-400' : 'bg-slate-600 hover:bg-amber-500 ring-transparent'}`}
                          aria-pressed={status === 'ok'}
                        />
                        <button
                          title={t('meditationBadTooltip')}
                          onClick={() => handleStatusChange(item.day, 'bad')}
                          className={`w-5 h-5 rounded-full transition-colors hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${status === 'bad' ? 'bg-red-500 ring-red-400' : 'bg-slate-600 hover:bg-red-500 ring-transparent'}`}
                          aria-pressed={status === 'bad'}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </Card>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-100">{t('todaysPassage')}</h2>
          {!isLoading && passage && (
            <button
              onClick={() => handleCopy(passage, setIsPassageCopied)}
              className="flex items-center px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
            >
              {isPassageCopied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{t('copied')}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>{t('copyButton')}</span>
                </>
              )}
            </button>
          )}
        </div>
        {isLoading ? <Spinner message={t('loadingPassage')} /> : error ? <p className="text-red-400 p-4 bg-red-500/10 rounded-lg">{error}</p> : (
          <div
            ref={passageContainerRef}
            onMouseUp={handleMouseUp}
            className="max-h-[50vh] overflow-y-auto p-4 bg-slate-900 rounded-lg text-slate-300 leading-loose relative"
          >
            {selectionPopover.visible && (
              <button
                onClick={handleExplainClick}
                className="absolute z-10 p-2 bg-sky-500 text-white rounded-full shadow-lg hover:bg-sky-400 transition-transform transform -translate-x-1/2 -translate-y-full animate-fade-in"
                style={{ left: `${selectionPopover.x}px`, top: `${selectionPopover.y}px` }}
                title={t('explainSelection')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {formatText(passage)}
          </div>
        )}
      </Card>

      {!isLoading && passage && (
        <>
          <StoryKeywords passage={passage} />
          <BibleChat passage={passage} />
        </>
      )}

      <Card>
        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block mr-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('lordsWill')}</span>
        </h2>
        {isLoading ? <Spinner message={t('analyzingIntent')} /> : error ? null : (
          <div className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
            {passageIntention}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-100">{t('meditationGuide')}</h2>
          {!isLoading && meditationGuide && (
            <button
              onClick={() => handleCopy(meditationGuide, setIsCopied)}
              className="flex items-center px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
            >
              {isCopied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{t('copied')}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>{t('copyButton')}</span>
                </>
              )}
            </button>
          )}
        </div>
        {isLoading ? <Spinner message={t('generatingGuide')} /> : error ? null : (
          <div className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
            {formatText(meditationGuide)}
          </div>
        )}
      </Card>
      <Card>
        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block mr-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" />
          </svg>
          <span>{t('timeAndPlace')}</span>
        </h2>
        {isLoading ? <Spinner message={t('generatingBg')} /> : error ? null : (
          <div>
            {isImageLoading && (
              <div className="w-full bg-slate-700 rounded-lg h-64 mb-4 flex items-center justify-center">
                <Spinner message={t('generatingBgImage')} />
              </div>
            )}
            {contextImageUrl && !isImageLoading && (
              <div className="mb-4 rounded-lg overflow-hidden shadow-lg">
                <img src={contextImageUrl} alt={t('biblicalContextAlt')} className="w-full h-auto object-cover" />
              </div>
            )}
            <div className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
              {passageContext}
            </div>
          </div>
        )}
      </Card>

      {!isLoading && passage && !error && (
        <div className="my-6 text-center">
          <button
            onClick={handleCompleteReading}
            disabled={isLoading || isSaving || isTodayArchived}
            className="w-full md:w-auto px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-green-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center mx-auto"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('meditationSaved')}
              </>
            ) : isTodayArchived ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('meditationAlreadySaved')}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('completeMeditation')}
              </>
            )}
          </button>
        </div>
      )}


      {!isLoading && passage && (
        <>
          <MusicRecommendation
            context={passage}
            title={t('passageMusicTitle')}
            id="passage-music-recommender"
          />
          <PrayerTraining passage={passage} />
          <SermonOutline passage={passage} />
        </>
      )}

      <ArchivedReadingModal
        reading={viewingArchivedDay ? archivedReadings[viewingArchivedDay] : null}
        onClose={() => setViewingArchivedDay(null)}
        formatText={formatText}
      />
      <ExplanationModal
        isOpen={explanationModal.isOpen}
        onClose={closeExplanationModal}
        isLoading={explanationModal.isLoading}
        error={explanationModal.error}
        selectedText={selectedText}
        explanation={explanationModal.content}
      />
    </div>
  );
};

export default BibleReading;
