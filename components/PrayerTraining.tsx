import React, { useState, useEffect } from 'react';
import { generatePrayerGuide } from '../services/geminiService';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { useLanguage } from '../i18n';

interface PrayerTrainingProps {
  passage: string;
}

const PrayerTraining: React.FC<PrayerTrainingProps> = ({ passage }) => {
  const { language, t } = useLanguage();
  const [prayerGuide, setPrayerGuide] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleGenerate = async () => {
    if (!isOnline) {
      setError(t('offlineError'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setPrayerGuide('');
    try {
      const generatedGuide = await generatePrayerGuide(passage, language);
      setPrayerGuide(generatedGuide);
    } catch (err) {
      console.error(err);
      setError(t('prayerApiError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!prayerGuide) return;
    navigator.clipboard.writeText(prayerGuide)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Clipboard copy failed:', err);
        alert(t('copyFailed'));
      });
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block mr-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>{t('prayerTraining')}</span>
        </h2>
        {prayerGuide && !isLoading && (
            <button
            onClick={handleCopy}
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

      {isLoading && <Spinner message={t('generatingPrayer')} />}
      {error && <p className="text-red-400 text-center mt-4 p-2 bg-red-500/10 rounded-lg">{error}</p>}
      
      {prayerGuide && !isLoading && (
        <div className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
            {prayerGuide}
        </div>
      )}

      {!prayerGuide && !isLoading && !error && (
        <div className="text-center py-4">
             <p className="text-slate-400 mb-4">{t('prayerPrompt')}</p>
             {!isOnline && <p className="text-amber-400 mb-4">{t('offlineError')}</p>}
            <button
                onClick={handleGenerate}
                disabled={isLoading || !isOnline}
                className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                {t('generatePrayerButton')}
            </button>
        </div>
      )}
    </Card>
  );
};

export default PrayerTraining;
