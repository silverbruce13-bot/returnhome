import React from 'react';
import { ArchivedReading } from '../types';
import { useLanguage } from '../i18n';
import Card from './common/Card';

interface ArchivedReadingModalProps {
  reading: ArchivedReading | null;
  onClose: () => void;
  // FIX: Replaced JSX.Element[] with React.ReactNode to resolve "Cannot find namespace 'JSX'" error.
  formatText: (text: string) => React.ReactNode;
}

const ArchivedReadingModal: React.FC<ArchivedReadingModalProps> = ({ reading, onClose, formatText }) => {
  const { t, language } = useLanguage();

  if (!reading) return null;
  
  const savedDate = new Date(reading.dateSaved).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-title"
    >
      <div 
        className="bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 id="archive-title" className="text-xl font-bold text-sky-400">
                {t('archivedMeditationTitle', { day: reading.day })}: {reading.readingReference}
            </h2>
            <p className="text-sm text-slate-400">{t('archiveDate', {date: savedDate})}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label={t('closeButton')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="overflow-y-auto p-6 space-y-6">
            <section>
                <h3 className="text-2xl font-bold text-slate-100 mb-4">{t('todaysPassage')}</h3>
                <div className="text-slate-300 leading-relaxed bg-slate-800 p-4 rounded-lg">
                    {formatText(reading.passage)}
                </div>
            </section>
            
            <section>
                <h3 className="text-2xl font-bold text-slate-100 mb-4">{t('meditationGuide')}</h3>
                <div className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed bg-slate-800 p-4 rounded-lg">
                    {formatText(reading.meditationGuide)}
                </div>
            </section>
            
            <section>
                 <h3 className="text-2xl font-bold text-slate-100 mb-4">{t('timeAndPlace')}</h3>
                 <div className="bg-slate-800 p-4 rounded-lg">
                    {reading.contextImageUrl && (
                        <div className="mb-4 rounded-lg overflow-hidden shadow-lg">
                            <img src={reading.contextImageUrl} alt={t('biblicalContextAlt')} className="w-full h-auto object-cover" />
                        </div>
                    )}
                    <p className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
                      {reading.context}
                    </p>
                 </div>
            </section>
        </main>
      </div>
    </div>
  );
};

export default ArchivedReadingModal;