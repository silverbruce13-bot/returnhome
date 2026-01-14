import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { recommendMusic } from '../services/geminiService';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { useLanguage } from '../i18n';

interface MusicRecommendationProps {
  context: string;
  title: string;
  id: string;
}

const MusicRecommendation: React.FC<MusicRecommendationProps> = ({ context, title, id }) => {
  const { language, t } = useLanguage();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isShared, setIsShared] = useState<boolean>(false);
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

  const handleRecommend = async () => {
    if (!isOnline) {
      setError(t('offlineError'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setSongs([]);
    try {
      const recommendedSongs = await recommendMusic(context, language);
      if (recommendedSongs.length === 0) {
        setError(t('recommendationError'));
      } else {
        setSongs(recommendedSongs);
      }
    } catch (err) {
      console.error(err);
      setError(t('recommendationApiError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    const playlistTitle = language === 'ko' ? '🎵 추천 찬양 플레이리스트 🎵' : '🎵 Recommended Praise Playlist 🎵';
    const playlistText = `${playlistTitle}\n\n${songs.map(song => `• ${song.title} - ${song.artist}`).join('\n')}`;
    navigator.clipboard.writeText(playlistText)
      .then(() => {
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      })
      .catch(err => {
        console.error('Clipboard copy failed:', err);
        alert(t('shareFailed'));
      });
  };

  const hasContext = context && context.trim().length > 0;

  return (
    <Card id={id}>
      <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block mr-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-13c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
        </svg>
        <span>{title}</span>
      </h2>
      
      {!hasContext && (
         <div className="text-center py-4 text-slate-400">
            <p>{t('recommendationPrompt')}</p>
            <p className="text-sm mt-1">{title.includes(t('diaryMusicTitle')) ? t('recommendationHintDiary') : t('recommendationHintPassage')}</p>
        </div>
      )}

      {!isOnline && hasContext && (
        <div className="text-center py-2 text-amber-400">
          <p>{t('offlineError')}</p>
        </div>
      )}

      {hasContext && (
        <div className="text-center">
            <button
                onClick={handleRecommend}
                disabled={isLoading || !isOnline}
                className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                {isLoading ? t('gettingRecommendation') : t('getAiRecommendation')}
            </button>
        </div>
      )}

      {isLoading && <Spinner message={t('aiPickingSongs')} />}
      {error && <p className="text-red-400 text-center mt-4 p-2 bg-red-500/10 rounded-lg">{error}</p>}
      
      {songs.length > 0 && !isLoading && (
        <div className="mt-6 space-y-3">
            <ul className="divide-y divide-slate-700">
                {songs.map((song, index) => (
                    <li key={index} className="py-3 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-slate-200">{song.title}</p>
                            <p className="text-sm text-slate-400">{song.artist}</p>
                        </div>
                        <a 
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + ' ' + song.artist)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
                            aria-label={`Search for ${song.title} on YouTube`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{t('listenOnYoutube')}</span>
                        </a>
                    </li>
                ))}
            </ul>
            <div className="text-right pt-4">
                 <button
                    onClick={handleShare}
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500"
                >
                    {isShared ? t('copied') : t('shareList')}
                </button>
            </div>
        </div>
      )}
    </Card>
  );
};

export default MusicRecommendation;
