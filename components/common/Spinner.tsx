import React from 'react';
import { useLanguage } from '../../i18n';

interface SpinnerProps {
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mb-4"></div>
      <p>{message || t('loading')}</p>
    </div>
  );
};

export default Spinner;