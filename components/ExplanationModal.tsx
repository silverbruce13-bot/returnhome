import React from 'react';
import { useLanguage } from '../i18n';
import Spinner from './common/Spinner';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  selectedText: string;
  explanation: string;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({ isOpen, onClose, isLoading, error, selectedText, explanation }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="explanation-title"
    >
      <div
        className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 id="explanation-title" className="text-xl font-bold text-sky-400">
            {t('explanationModalTitle')}
          </h2>
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

        <main className="overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-400 mb-2">{t('selectedTextLabel')}</h3>
            <blockquote className="border-l-4 border-sky-500 pl-4 py-2 bg-slate-800 text-slate-200 rounded-r-lg italic">
              {selectedText}
            </blockquote>
          </div>
          
          <div className="mt-4">
            {isLoading && <Spinner message={t('generatingExplanation')} />}
            {error && <p className="text-red-400 p-4 bg-red-500/10 rounded-lg">{error}</p>}
            {!isLoading && !error && (
              <div className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
                {explanation}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExplanationModal;
