
import React, { createContext, useState, useContext, useMemo, ReactNode } from 'react';

export type Language = 'ko' | 'en';

export const translations = {
  ko: {
    appName: "귀로 : 집으로 돌아오는 길",
    appDescription: "바울서신 매일 읽기 및 묵상, 회개와 결단, 전도의 삶을 기록하는 신앙 성장 앱입니다. 제미나이 AI가 당신의 묵상과 전도 계획을 돕습니다.",
    headerSubtitle: "주님께로 향하는 회복과 소망의 여정",
    headerTitle: "귀로 : 집으로 돌아오는 길",
    todaysWord: "오늘의 말씀",
    navReading: "읽기 & 묵상",
    navDiary: "신앙 일기",
    navMission: "전도 & 선교",
    navMap: "선교 여정 맵",
    footer: "© {year} 선한영성서당. Powered by Google Gemini.",
    readingFirst: "'읽기 & 묵상' 탭에서 오늘의 말씀을 먼저 읽어주세요.",
    // Spinner
    loading: "불러오는 중...",
    // BibleReading
    readingPlanTitle: "바울서신 읽기 순서",
    hideButton: "숨기기",
    showAllButton: "전체 순서 보기",
    readingPlanInfo: "바울서신을 매일 2장씩 읽으면 총 {totalDays}일이 소요됩니다. 현재 {currentDay}일차 말씀을 읽고 있습니다.",
    meditationRecordGuide: "묵상 기록하기:",
    meditationRecordInstruction: "각 날짜의 묵상 상태를 버튼으로 기록하고 관리해보세요.",
    meditationGood: "녹색: 잘됨",
    meditationOk: "주황색: 보통",
    meditationBad: "빨간색: 못함",
    day: "{day}일차",
    meditationGoodTooltip: "묵상 잘됨",
    meditationOkTooltip: "묵상 보통",
    meditationBadTooltip: "묵상 못함",
    todaysPassage: "오늘의 말씀",
    copyButton: "공유하기",
    copied: "복사됨!",
    copyFailed: "복사에 실패했습니다. 브라우저 설정을 확인해주세요.",
    loadingPassage: "말씀을 불러오는 중...",
    apiQuotaExceeded: "API 요청 할당량이 초과되었습니다. 나중에 다시 시도해 주세요. 이 메시지가 계속되면 관리자에게 문의하세요.",
    contentError: "콘텐츠를 불러오는 중 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.",
    lordsWill: "주님의 뜻 (AI)",
    analyzingIntent: "말씀의 의도를 분석하는 중...",
    meditationGuide: "오늘의 묵상 가이드 (AI)",
    generatingGuide: "묵상 가이드를 생성하는 중...",
    timeAndPlace: "어떤 시간, 어떤 장소",
    generatingBg: "배경 정보를 생성하는 중...",
    generatingBgImage: "배경 이미지를 생성하는 중...",
    biblicalContextAlt: "성경적 배경",
    passageMusicTitle: "오늘의 말씀을 위한 찬양",
    completeMeditation: "오늘의 묵상 완료",
    meditationSaved: "묵상이 기록되었습니다!",
    meditationAlreadySaved: "묵상 완료됨",
    reviewButton: "복습하기",
    archivedMeditationTitle: "{day}일차 묵상 기록",
    archiveDate: "기록일: {date}",
    closeButton: "닫기",
    jumpToDay: "이 날로 이동",
    currentReadingMark: "현재 읽는 중",
    // FaithDiary
    diaryTitle: "나의 신앙 일기",
    repentanceLabel: "회개와 감사",
    repentancePlaceholder: "하나님 앞에서 하루를 돌아보며, 회개할 부분과 감사한 일들을 솔직하게 기록해 보세요.",
    resolveLabel: "결단과 적용",
    resolvePlaceholder: "오늘의 말씀을 삶에 어떻게 적용할지 구체적으로 결단하고 기록해 보세요.",
    dreamLabel: "하나님이 주신 꿈",
    dreamPlaceholder: "말씀과 기도를 통해 하나님께서 보여주시는 비전과 꿈을 기록하고 기도하세요.",
    saveDiaryButton: "일기 저장",
    saved: "저장됨!",
    todaysRecord: "오늘의 기록",
    noRecords: "아직 저장된 기록이 없습니다.",
    noRecordsHint: "일기를 작성하고 '일기 저장' 버튼을 눌러주세요.",
    savedAt: "저장 시간: {time}",
    diaryMusicTitle: "내 마음을 위한 찬양",
    syncingEntries: "기록을 동기화하는 중...",
    // EvangelismMission
    evangelismTraining: "전도 훈련 (AI)",
    generatingTips: "전도 팁을 생성하는 중...",
    tipsFailed: "전도 팁을 불러오는데 실패했습니다.",
    myMissionPlan: "나의 전도와 선교 계획",
    missionPlanPlaceholder: "오늘 만나는 사람들에게 어떻게 하나님의 사랑을 전할지 구체적으로 계획하고 기도해 보세요.",
    savePlanButton: "계획 저장",
    myRecords: "나의 기록",
    noPlans: "아직 저장된 계획이 없습니다.",
    noPlansHint: "계획을 작성하고 '계획 저장' 버튼을 눌러주세요.",
    syncingPlans: "계획을 동기화하는 중...",
    // MissionMap
    missionMapTitle: "바울의 선교 여정 체험하기",
    journey1: "제1차 선교 여행",
    journey2: "제2차 선교 여행",
    journey3: "제3차 선교 여행",
    journeyRome: "로마 여정",
    associatedEpistles: "관련 서신서",
    exploreCity: "장소 상세 정보 (AI)",
    viewOnGoogleMaps: "구글 맵에서 보기",
    loadingPlaceInfo: "지리적 배경을 불러오는 중...",
    selectCityHint: "위의 여정에서 도시를 선택하여 상세 정보를 확인하세요.",
    generatingJourneyMap: "여정 지도를 그려내는 중...",
    journeyMapAlt: "바울의 선교 여정 예술적 스케치",
    // MusicRecommendation
    recommendationError: "추천할 만한 찬양을 찾지 못했습니다. 다른 내용으로 시도해 보세요.",
    recommendationApiError: "찬양을 추천하는 중 오류가 발생했습니다.",
    shareFailed: "공유에 실패했습니다.",
    recommendationPrompt: "오늘의 말씀 또는 일기 내용을 바탕으로 찬양을 추천받으세요.",
    recommendationHintDiary: "먼저 일기를 저장해주세요.",
    recommendationHintPassage: "말씀이 로드된 후 시도해주세요.",
    gettingRecommendation: "추천받는 중...",
    getAiRecommendation: "AI 찬양 추천받기",
    aiPickingSongs: "AI가 찬양을 고르는 중...",
    listenOnYoutube: "듣기",
    shareList: "목록 공유",
    // PrayerTraining
    prayerTraining: "기도 훈련 (AI)",
    generatingPrayer: "AI가 기도문을 작성하는 중...",
    prayerApiError: "기도문을 생성하는 중 오류가 발생했습니다.",
    prayerPrompt: "오늘의 말씀을 따라 기도하며 주님과의 교제를 더욱 깊게 나눠보세요.",
    generatePrayerButton: "기도문 생성하기",
    // Sermon Outline
    sermonOutlineTitle: "설교 개요 (AI)",
    generateSermonButton: "설교 개요 생성하기",
    generatingSermon: "AI가 설교 개요를 작성하는 중...",
    sermonApiError: "설교 개요를 생성하는 중 오류가 발생했습니다.",
    sermonPrompt: "오늘의 말씀을 바탕으로 성도들을 위한 실질적인 설교 개요를 작성해 보세요.",
    // Chat
    chatWithAiTitle: "말씀 챗봇 (AI)",
    chatPlaceholder: "궁금한 내용을 입력하세요...",
    sendButton: "전송",
    aiThinking: "답변을 생각 중입니다...",
    // Story Keywords
    storyKeywordsTitle: "오늘의 스토리 키워드 (AI)",
    generatingKeywords: "스토리 키워드를 추출하는 중...",
    keywordsApiError: "스토리 키워드 생성에 실패했습니다.",
    positiveMode: "긍정 모드 (사랑, 은혜)",
    sinMode: "죄의 적대 모드 (경고, 회개)",
    hopeMode: "미래와 소망 모드 (약속, 구원)",
    // Languages
    korean: "한국어",
    english: "English",
    // Offline/Network
    offlineError: "이 기능을 사용하려면 인터넷 연결이 필요합니다.",
    chatOffline: "챗봇 기능은 온라인 상태에서만 사용할 수 있습니다.",
    // Verse Explanation
    explainSelection: "의미 물어보기",
    explanationModalTitle: "깊이 있는 해설 (AI)",
    selectedTextLabel: "선택한 구절:",
    generatingExplanation: "해설을 생성하는 중입니다...",
    explanationApiError: "해설을 생성하는 중 오류가 발생했습니다.",
  },
  en: {
    appName: "Return Journey: The Way Back Home",
    appDescription: "A faith growth app for daily reading and meditation on the Pauline Epistles, recording a life of repentance, resolution, and evangelism. Gemini AI helps with your meditation and evangelism planning.",
    headerSubtitle: "A Journey of Restoration and Hope toward the Lord",
    headerTitle: "Return Journey",
    todaysWord: "Today's Word",
    navReading: "Reading & Meditation",
    navDiary: "Faith Diary",
    navMission: "Evangelism & Mission",
    navMap: "Mission Journey Map",
    footer: "© {year} Seonhan Yeongseong Seodang. Powered by Google Gemini.",
    readingFirst: "Please read today's passage first in the 'Reading & Meditation' tab.",
    // Spinner
    loading: "Loading...",
    // BibleReading
    readingPlanTitle: "Pauline Epistles Reading Order",
    hideButton: "Hide",
    showAllButton: "Show Full Order",
    readingPlanInfo: "Reading 2 chapters of the Pauline Epistles daily will take a total of {totalDays} days. You are currently reading Day {currentDay}.",
    meditationRecordGuide: "Record Your Meditation:",
    meditationRecordInstruction: "Track and manage your meditation status for each day using the buttons.",
    meditationGood: "Green: Good",
    meditationOk: "Orange: Okay",
    meditationBad: "Red: Didn't Do",
    day: "Day {day}",
    meditationGoodTooltip: "Meditation went well",
    meditationOkTooltip: "Meditation was okay",
    meditationBadTooltip: "Didn't meditate",
    todaysPassage: "Today's Passage",
    copyButton: "Share",
    copied: "Copied!",
    copyFailed: "Failed to copy. Please check your browser settings.",
    loadingPassage: "Loading passage...",
    apiQuotaExceeded: "API request quota has been exceeded. Please try again later. If this message persists, contact the administrator.",
    contentError: "An error occurred while loading content. Please check your network connection and try again.",
    lordsWill: "The Lord's Will (AI)",
    analyzingIntent: "Analyzing the intent of the passage...",
    meditationGuide: "Today's Meditation Guide (AI)",
    generatingGuide: "Generating meditation guide...",
    timeAndPlace: "What Time, What Place",
    generatingBg: "Generating background information...",
    generatingBgImage: "Generating background image...",
    biblicalContextAlt: "Biblical context",
    passageMusicTitle: "Praise for Today's Word",
    completeMeditation: "Complete Today's Meditation",
    meditationSaved: "Meditation Saved!",
    meditationAlreadySaved: "Meditation Completed",
    reviewButton: "Review",
    archivedMeditationTitle: "Archived Meditation for Day {day}",
    archiveDate: "Date Saved: {date}",
    closeButton: "Close",
    jumpToDay: "Go to this day",
    currentReadingMark: "Currently reading",
    // FaithDiary
    diaryTitle: "My Faith Diary",
    repentanceLabel: "Repentance and Gratitude",
    repentancePlaceholder: "Reflect on your day before God, and honestly record areas for repentance and things you're grateful for.",
    resolveLabel: "Resolution and Application",
    resolvePlaceholder: "Decide specifically how you will apply today's word to your life and write it down.",
    dreamLabel: "God-Given Dream",
    dreamPlaceholder: "Record the vision and dreams God shows you through His word and prayer, and pray over them.",
    saveDiaryButton: "Save Diary",
    saved: "Saved!",
    todaysRecord: "Today's Record",
    noRecords: "No records saved yet.",
    noRecordsHint: "Write in your diary and press the 'Save Diary' button.",
    savedAt: "Saved at: {time}",
    diaryMusicTitle: "Praise for My Heart",
    syncingEntries: "Syncing entries...",
    // EvangelismMission
    evangelismTraining: "Evangelism Training (AI)",
    generatingTips: "Generating evangelism tips...",
    tipsFailed: "Failed to load evangelism tips.",
    myMissionPlan: "My Evangelism and Mission Plan",
    missionPlanPlaceholder: "Plan and pray specifically on how you will share God's love with the people you meet today.",
    savePlanButton: "Save Plan",
    myRecords: "My Records",
    noPlans: "No plans saved yet.",
    noPlansHint: "Write a plan and press the 'Save Plan' button.",
    syncingPlans: "Syncing plans...",
    // MissionMap
    missionMapTitle: "Experience Paul's Mission Journeys",
    journey1: "1st Mission Journey",
    journey2: "2nd Mission Journey",
    journey3: "3rd Mission Journey",
    journeyRome: "Journey to Rome",
    associatedEpistles: "Associated Epistles",
    exploreCity: "Place Details (AI)",
    viewOnGoogleMaps: "View on Google Maps",
    loadingPlaceInfo: "Fetching geographical background...",
    selectCityHint: "Select a city from the journey above to see details.",
    generatingJourneyMap: "Sketching the journey map...",
    journeyMapAlt: "Artistic sketch of Paul's mission journey",
    // MusicRecommendation
    recommendationError: "Couldn't find any suitable songs to recommend. Try with different content.",
    recommendationApiError: "An error occurred while recommending music.",
    shareFailed: "Failed to share.",
    recommendationPrompt: "Get song recommendations based on today's passage or diary entry.",
    recommendationHintDiary: "Please save your diary first.",
    recommendationHintPassage: "Please try after the passage has loaded.",
    gettingRecommendation: "Getting recommendations...",
    getAiRecommendation: "Get AI Song Recommendation",
    aiPickingSongs: "AI is picking songs...",
    listenOnYoutube: "Listen",
    shareList: "Share List",
    // PrayerTraining
    prayerTraining: "Prayer Training (AI)",
    generatingPrayer: "AI is writing a prayer...",
    prayerApiError: "An error occurred while generating the prayer guide.",
    prayerPrompt: "Deepen your fellowship with the Lord by praying according to today's word.",
    generatePrayerButton: "Generate Prayer",
    // Sermon Outline
    sermonOutlineTitle: "Sermon Outline (AI)",
    generateSermonButton: "Generate Sermon Outline",
    generatingSermon: "Generating sermon outline...",
    sermonApiError: "An error occurred while generating the sermon outline.",
    sermonPrompt: "Create a practical sermon outline for your congregation based on today's passage.",
    // Chat
    chatWithAiTitle: "Bible Chatbot (AI)",
    chatPlaceholder: "Type your question here...",
    sendButton: "Send",
    aiThinking: "AI is thinking...",
    // Story Keywords
    storyKeywordsTitle: "Today's Story Keywords (AI)",
    generatingKeywords: "Extracting story keywords...",
    keywordsApiError: "Failed to generate story keywords.",
    positiveMode: "Positive Mode (Love, Grace)",
    sinMode: "Sin/Conflict Mode (Warning, Repentance)",
    hopeMode: "Hope/Future Mode (Promise, Salvation)",
    // Languages
    korean: "한국어",
    english: "English",
    // Offline/Network
    offlineError: "An internet connection is required to use this feature.",
    chatOffline: "The chatbot feature is only available when you are online.",
    // Verse Explanation
    explainSelection: "Ask for Meaning",
    explanationModalTitle: "In-Depth Explanation (AI)",
    selectedTextLabel: "Selected Verse:",
    generatingExplanation: "Generating explanation...",
    explanationApiError: "An error occurred while generating the explanation.",
  }
};

type Translations = typeof translations.ko;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof Translations, vars?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');

  const t = useMemo(() => (key: keyof Translations, vars?: { [key: string]: string | number }) => {
    let text = translations[language][key] || translations['en'][key] || key;
    if (vars) {
      for (const k in vars) {
        text = text.replace(`{${k}}`, String(vars[k]));
      }
    }
    return text;
  }, [language]);

  const value = { language, setLanguage, t };

  return React.createElement(LanguageContext.Provider, { value }, children);
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
