
import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { useLanguage } from '../i18n';
import { MissionJourney, JourneyStep, PlaceInfoResponse } from '../types';
import { fetchPlaceInfo, generateJourneyMap } from '../services/geminiService';

const JOURNEYS: MissionJourney[] = [
  {
    id: 1,
    title: { ko: "제1차 선교 여행", en: "1st Mission Journey" },
    steps: [
      { 
        city: { ko: "수리아 안디옥", en: "Syrian Antioch" }, 
        description: { ko: "이방 선교의 중심지이자 바울과 바나바를 파송한 교회", en: "The center of Gentile missions and the church that sent Paul and Barnabas" } 
      },
      { 
        city: { ko: "실루기아", en: "Seleucia" }, 
        description: { ko: "안디옥의 관문이 되는 항구 도시", en: "A port city serving as the gateway to Antioch" } 
      },
      { 
        city: { ko: "구브로 (살라미, 바보)", en: "Cyprus (Salamis, Paphos)" }, 
        description: { ko: "총독 서기오 바울의 회심과 박수 엘루마 사건", en: "Conversion of Governor Sergius Paulus and the encounter with Elymas the sorcerer" } 
      },
      { 
        city: { ko: "밤빌리아 버가", en: "Perga in Pamphylia" }, 
        description: { ko: "마가 요한이 예루살렘으로 돌아간 장소", en: "The place where John Mark departed and returned to Jerusalem" } 
      },
      { 
        city: { ko: "비시디아 안디옥", en: "Pisidian Antioch" }, 
        description: { ko: "회당에서 선포된 바울의 첫 공식 설교와 이방인 선교의 전환점", en: "Paul's first recorded sermon in the synagogue and a turning point for Gentile mission" }, 
        epistles: [{ ko: "갈라디아서", en: "Galatians" }] 
      },
      { 
        city: { ko: "이고니온", en: "Iconium" }, 
        description: { ko: "수많은 유대인과 헬라인이 믿게 되었으며 표적과 기사가 나타난 곳", en: "Where a great number of Jews and Greeks believed, and signs and wonders were performed" },
        epistles: [{ ko: "갈라디아서", en: "Galatians" }]
      },
      { 
        city: { ko: "루스드라", en: "Lystra" }, 
        description: { ko: "나면서 걷지 못한 자를 치유하고 바울이 돌에 맞은 장소", en: "The healing of a lame man and where Paul survived being stoned" },
        epistles: [{ ko: "갈라디아서", en: "Galatians" }]
      },
      { 
        city: { ko: "더베", en: "Derbe" }, 
        description: { ko: "복음을 전하여 많은 제자를 삼고 제1차 여정의 반환점이 된 도시", en: "Preached the gospel, won many disciples, and served as the turnaround point of the 1st journey" },
        epistles: [{ ko: "갈라디아서", en: "Galatians" }]
      },
    ]
  },
  {
    id: 2,
    title: { ko: "제2차 선교 여행", en: "2nd Mission Journey" },
    steps: [
      { city: { ko: "안디옥", en: "Antioch" }, description: { ko: "재출발", en: "Restart" } },
      { city: { ko: "다소", en: "Tarsus" }, description: { ko: "바울의 고향", en: "Paul's hometown" } },
      { city: { ko: "루스드라", en: "Lystra" }, description: { ko: "디모데와의 만남", en: "Meeting Timothy" } },
      { city: { ko: "드로아", en: "Troas" }, description: { ko: "환상을 봄", en: "Had a vision of Macedonia" } },
      { city: { ko: "빌립보", en: "Philippi" }, description: { ko: "루디아의 회심, 감옥 사건", en: "Lydia's conversion, jail incident" }, epistles: [{ ko: "빌립보서", en: "Philippians" }] },
      { city: { ko: "데살로니가", en: "Thessalonica" }, description: { ko: "야손의 집", en: "Jason's house" }, epistles: [{ ko: "데살로니가전후서", en: "1&2 Thessalonians" }] },
      { city: { ko: "베뢰아", en: "Berea" }, description: { ko: "말씀을 간절히 받음", en: "Eagerly received the word" } },
      { city: { ko: "아덴 (아테네)", en: "Athens" }, description: { ko: "아레오바고 설교", en: "Areopagus sermon" } },
      { city: { ko: "고린도", en: "Corinth" }, description: { ko: "18개월 체류, 브리스길라와 아굴라", en: "18 months stay, Priscilla and Aquila" }, epistles: [{ ko: "고린도전후서", en: "1&2 Corinthians" }] },
    ]
  },
  {
    id: 3,
    title: { ko: "제3차 선교 여행", en: "3rd Mission Journey" },
    steps: [
      { city: { ko: "안디옥", en: "Antioch" }, description: { ko: "출발", en: "Departure" } },
      { city: { ko: "에베소", en: "Ephesus" }, description: { ko: "두란노 서원, 3년 사역", en: "Lecture hall of Tyrannus, 3 years ministry" }, epistles: [{ ko: "에베소서", en: "Ephesians" }] },
      { city: { ko: "마게도냐", en: "Macedonia" }, description: { ko: "교회들을 위로함", en: "Encouraged the churches" } },
      { city: { ko: "밀레도", en: "Miletus" }, description: { ko: "에베소 장로들과의 작별", en: "Farewell to Ephesian elders" } },
      { city: { ko: "두로", en: "Tyre" }, description: { ko: "제자들의 경고", en: "Disciples' warnings" } },
      { city: { ko: "가이사랴", en: "Caesarea" }, description: { ko: "빌립의 집", en: "Philip's house" } },
      { city: { ko: "예루살렘", en: "Jerusalem" }, description: { ko: "체포됨", en: "Being arrested" } },
    ]
  },
  {
    id: 4,
    title: { ko: "로마 여정", en: "Journey to Rome" },
    steps: [
      { city: { ko: "가이사랴", en: "Caesarea" }, description: { ko: "2년 구금, 아그립바 왕 앞 설교", en: "2 years detention, preaching before Agrippa" } },
      { city: { ko: "미항", en: "Fair Havens" }, description: { ko: "항해의 경고", en: "Warning of the voyage" } },
      { city: { ko: "멜리데 (몰타)", en: "Malta" }, description: { ko: "난파와 기적", en: "Shipwreck and miracles" } },
      { city: { ko: "보디올", en: "Puteoli" }, description: { ko: "이탈리아 상륙", en: "Landing in Italy" } },
      { city: { ko: "로마", en: "Rome" }, description: { ko: "셋집 연금, 복음 전파", en: "Rented house, spreading the gospel" }, epistles: [{ ko: "로마서", en: "Romans" }] },
    ]
  }
];

const MissionMap: React.FC = () => {
  const { language, t } = useLanguage();
  const [selectedJourneyId, setSelectedJourneyId] = useState(1);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [placeInfo, setPlaceInfo] = useState<PlaceInfoResponse | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [journeyMapUrl, setJourneyMapUrl] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [visitedSteps, setVisitedSteps] = useState<Record<number, number[]>>(() => {
    try {
      const saved = window.localStorage.getItem('mission-visited-steps');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const currentJourney = useMemo(() => 
    JOURNEYS.find(j => j.id === selectedJourneyId) || JOURNEYS[0]
  , [selectedJourneyId]);

  const progressPercentage = useMemo(() => {
    const visited = visitedSteps[selectedJourneyId] || [];
    const total = currentJourney.steps.length;
    return Math.round((visited.length / total) * 100);
  }, [selectedJourneyId, visitedSteps, currentJourney]);

  const safeSetItem = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        Object.keys(window.localStorage).forEach(k => {
          if (k.startsWith('reading-cache-') || k.startsWith('header-sketch-') || k.startsWith('journey-map-')) {
            window.localStorage.removeItem(k);
          }
        });
        try {
          window.localStorage.setItem(key, value);
        } catch {}
      }
    }
  };

  useEffect(() => {
    safeSetItem('mission-visited-steps', JSON.stringify(visitedSteps));
  }, [visitedSteps]);

  useEffect(() => {
    const fetchMap = async () => {
      const cacheKey = `journey-map-${selectedJourneyId}-${language}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setJourneyMapUrl(cached);
        return;
      }

      setIsMapLoading(true);
      setJourneyMapUrl(null);
      const cities = currentJourney.steps.map(s => s.city[language]);
      const title = currentJourney.title[language];

      try {
        const url = await generateJourneyMap(title, cities, language);
        if (url) {
          setJourneyMapUrl(url);
          safeSetItem(cacheKey, url);
        }
      } catch (err) {
        console.error("Failed to fetch journey map:", err);
      } finally {
        setIsMapLoading(false);
      }
    };

    fetchMap();
  }, [selectedJourneyId, language]);

  const handleStepClick = async (index: number) => {
    setSelectedStepIndex(index);
    
    setVisitedSteps(prev => {
      const journeyVisited = prev[selectedJourneyId] || [];
      if (!journeyVisited.includes(index)) {
        return { ...prev, [selectedJourneyId]: [...journeyVisited, index] };
      }
      return prev;
    });

    const step = currentJourney.steps[index];
    const city = step.city[language];
    const journeyTitle = currentJourney.title[language];

    setIsLoadingInfo(true);
    setPlaceInfo(null);
    setError(null);

    try {
      const info = await fetchPlaceInfo(city, journeyTitle, language);
      setPlaceInfo(info);
    } catch (err) {
      console.error(err);
      setError(t('recommendationApiError'));
    } finally {
      setIsLoadingInfo(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('missionMapTitle')}
            </h2>
            
            <div className="flex-1 max-w-xs">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {language === 'ko' ? '여정 진행률' : 'Journey Progress'}
                    </span>
                    <span className="text-xs font-bold text-sky-400">{progressPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide mb-6 border-b border-slate-700">
          {JOURNEYS.map(j => (
            <button
              key={j.id}
              onClick={() => { setSelectedJourneyId(j.id); setSelectedStepIndex(null); setPlaceInfo(null); }}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedJourneyId === j.id 
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {j.title[language]}
              {(visitedSteps[j.id]?.length || 0) === JOURNEYS.find(item => item.id === j.id)?.steps.length && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
              )}
            </button>
          ))}
        </div>

        <div className="relative mb-8 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 group">
          {isMapLoading ? (
            <div className="h-64 md:h-80 flex flex-col items-center justify-center">
              <Spinner message={t('generatingJourneyMap')} />
            </div>
          ) : journeyMapUrl ? (
            <div className="relative">
                <img 
                    src={journeyMapUrl} 
                    alt={t('journeyMapAlt')} 
                    className="w-full h-auto object-cover max-h-[500px] transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 left-6">
                    <span className="text-white text-lg font-bold drop-shadow-lg">{currentJourney.title[language]}</span>
                </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 italic">
              Map could not be loaded
            </div>
          )}
        </div>

        <div className="relative mt-8 mb-4">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-700" />
          
          <div className="flex overflow-x-auto gap-8 pb-6 scrollbar-hide relative z-10 px-4">
            {currentJourney.steps.map((step, idx) => {
              const isVisited = (visitedSteps[selectedJourneyId] || []).includes(idx);
              const isSelected = selectedStepIndex === idx;

              return (
                <div key={idx} className="flex flex-col items-center min-w-[120px]">
                  <button
                    onClick={() => handleStepClick(idx)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all hover:scale-110 relative ${
                      isSelected
                        ? 'bg-sky-500 border-sky-300 text-white scale-110 shadow-lg shadow-sky-900/40'
                        : isVisited
                        ? 'bg-sky-900 border-sky-700 text-sky-300'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}
                  >
                    {isVisited && !isSelected ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        idx + 1
                    )}
                  </button>
                  <p className={`mt-3 text-sm font-bold text-center px-1 ${isSelected ? 'text-sky-400' : isVisited ? 'text-sky-200' : 'text-slate-300'}`}>
                    {step.city[language]}
                  </p>
                  {step.epistles && (
                      <div className="mt-1 flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title={t('associatedEpistles')} />
                      </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="h-full">
            <h3 className="text-xl font-bold text-slate-100 mb-4">{t('todaysRecord')}</h3>
            {selectedStepIndex !== null ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sky-400 font-bold text-lg mb-1">{currentJourney.steps[selectedStepIndex].city[language]}</h4>
                  <p className="text-slate-300 leading-relaxed">{currentJourney.steps[selectedStepIndex].description[language]}</p>
                </div>
                {currentJourney.steps[selectedStepIndex].epistles && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                    <h5 className="text-amber-400 text-xs font-bold uppercase mb-2 tracking-widest">{t('associatedEpistles')}</h5>
                    <ul className="space-y-1">
                      {currentJourney.steps[selectedStepIndex].epistles?.map((e, i) => (
                        <li key={i} className="text-slate-200 text-sm flex items-center">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                           </svg>
                           {e[language]}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 italic text-sm">{t('selectCityHint')}</p>
            )}
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
             <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                </svg>
                {t('exploreCity')}
             </h3>
             {isLoadingInfo ? (
               <Spinner message={t('loadingPlaceInfo')} />
             ) : error ? (
               <p className="text-red-400 p-4 bg-red-500/10 rounded-lg">{error}</p>
             ) : placeInfo ? (
               <div className="space-y-6">
                 <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    {placeInfo.text}
                 </div>
                 {placeInfo.links.length > 0 && (
                   <div className="space-y-3">
                     <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('viewOnGoogleMaps')}</h4>
                     <div className="flex flex-wrap gap-3">
                       {placeInfo.links.map((link, i) => (
                         <a
                           key={i}
                           href={link.uri}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sky-400 rounded-lg transition-colors border border-sky-900/30 text-sm font-semibold"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                           </svg>
                           {link.title}
                         </a>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             ) : (
               <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-xl">
                 <p className="text-slate-500 italic text-center px-4">{t('selectCityHint')}</p>
               </div>
             )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MissionMap;
