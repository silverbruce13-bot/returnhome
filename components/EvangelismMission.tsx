import React, { useState, useEffect, useCallback } from 'react';
import { generateEvangelismTips } from '../services/geminiService';
import { getMissionPlans, saveMissionPlans } from '../services/syncService';
import { SavedPlanEntry } from '../types';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { useLanguage } from '../i18n';

interface EvangelismMissionProps {
  passage: string;
  storageKey: string;
}

const EvangelismMission: React.FC<EvangelismMissionProps> = ({ passage, storageKey }) => {
  const { language, t } = useLanguage();
  const [tips, setTips] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [savedEntries, setSavedEntries] = useState<SavedPlanEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
        setIsSyncing(true);
        try {
            const plans = await getMissionPlans(storageKey);
            setSavedEntries(plans);
        } catch (error) {
            console.error("Failed to fetch mission plans:", error);
        } finally {
            setIsSyncing(false);
        }
    };
    fetchPlans();
  }, [storageKey]);

  const fetchTips = useCallback(async () => {
    if (!passage) return;

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `evangelism-tips-${today}-${language}`;

    // 1. Try to load from cache
    try {
      const cachedTips = window.localStorage.getItem(cacheKey);
      if (cachedTips) {
        setTips(cachedTips);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error("Failed to read evangelism tips from cache", e);
    }
    
    setIsLoading(true);
    try {
      // 2. Fetch if not cached
      const generatedTips = await generateEvangelismTips(passage, language);
      setTips(generatedTips);
      // 3. Save to cache
      window.localStorage.setItem(cacheKey, generatedTips);
    } catch (error) {
      console.error("Failed to fetch evangelism tips:", error);
      setTips(t('tipsFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [passage, language, t]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  const handleSave = async () => {
    if (!currentPlan.trim()) return;
    
    const locale = language === 'ko' ? 'ko-KR' : 'en-US';
    const newEntry: SavedPlanEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: true }),
      content: currentPlan,
    };

    const newEntries = [newEntry, ...savedEntries];
    setSavedEntries(newEntries); // Optimistic update
    setCurrentPlan(''); // Clear textarea after saving
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);

    try {
        await saveMissionPlans(storageKey, newEntries);
    } catch (error) {
        console.error("Failed to save mission plan:", error);
        setSavedEntries(savedEntries); // Revert on error
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">{t('evangelismTraining')}</h2>
        {isLoading ? <Spinner message={t('generatingTips')} /> : (
          <div className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
            {tips}
          </div>
        )}
      </Card>
      <Card>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">{t('myMissionPlan')}</h2>
        <textarea
          rows={8}
          value={currentPlan}
          onChange={(e) => setCurrentPlan(e.target.value)}
          className="w-full p-3 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition placeholder-slate-400"
          placeholder={t('missionPlanPlaceholder')}
        />
        <div className="text-right mt-4">
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
          >
            {isSaved ? t('saved') : t('savePlanButton')}
          </button>
        </div>
        
        <div className="mt-8 border-t border-slate-700 pt-6">
          <h3 className="text-xl font-bold text-slate-100 mb-4">{t('myRecords')}</h3>
          {isSyncing ? (
            <Spinner message={t('syncingPlans')} />
          ) : savedEntries.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>{t('noPlans')}</p>
              <p className="text-sm mt-1">{t('noPlansHint')}</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {savedEntries.map((entry) => (
                <div key={entry.id} className="bg-slate-700/50 p-5 rounded-lg border border-slate-700 transition-shadow hover:bg-slate-700">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2">
                    <p className="text-sm font-bold text-sky-400 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('savedAt', { time: entry.timestamp })}
                    </p>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap mt-2 text-sm leading-relaxed">{entry.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EvangelismMission;
