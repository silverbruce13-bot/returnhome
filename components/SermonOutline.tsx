import React, { useState, useEffect } from 'react';
import { generateSermonOutline } from '../services/geminiService';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { useLanguage } from '../i18n';

interface SermonOutlineProps {
  passage: string;
}

const SermonOutline: React.FC<SermonOutlineProps> = ({ passage }) => {
  const { language, t } = useLanguage();
  const [outline, setOutline] = useState<string>('');
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
    setOutline('');
    try {
      const generatedOutline = await generateSermonOutline(passage, language);
      setOutline(generatedOutline);
    } catch (err) {
      console.error(err);
      setError(t('sermonApiError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outline) return;
    navigator.clipboard.writeText(outline)
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{t('sermonOutlineTitle')}</span>
        </h2>
        {outline && !isLoading && (
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

      {isLoading && <Spinner message={t('generatingSermon')} />}
      {error && <p className="text-red-400 text-center mt-4 p-2 bg-red-500/10 rounded-lg">{error}</p>}
      
      {outline && !isLoading && (
        <div className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
            {outline}
        </div>
      )}

      {!outline && !isLoading && !error && (
        <div className="text-center py-4">
             <p className="text-slate-400 mb-4">{t('sermonPrompt')}</p>
             {!isOnline && <p className="text-amber-400 mb-4">{t('offlineError')}</p>}
            <button
                onClick={handleGenerate}
                disabled={isLoading || !isOnline}
                className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                {t('generateSermonButton')}
            </button>
        </div>
      )}
    </Card>
  );
};

export default SermonOutline;
