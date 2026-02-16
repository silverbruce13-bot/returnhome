
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { useLanguage } from '../i18n';
import Card from './common/Card';
import Spinner from './common/Spinner';

interface BibleChatProps {
  passage: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

let ai: any = null;
try {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("BibleChat: API Key is missing. Chat features will be disabled.");
  }
} catch (error) {
  console.error("BibleChat: Failed to initialize GoogleGenAI:", error);
}

const BibleChat: React.FC<BibleChatProps> = ({ passage }) => {
  const { language, t } = useLanguage();
  const [chat, setChat] = useState<Chat | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Initialize chat session
  useEffect(() => {
    if (!passage || !isOnline) return;

    const systemInstruction = language === 'ko'
      ? `당신은 '가상 오케스트레이터 폴샘(Paul Teacher)'입니다. 당신의 페르소나는 사도 바울(Apostle Paul)입니다.
      
      [페르소나 특징]
      1. **정체성**: 당신은 이방인의 사도이자 로마서, 고린도전후서 등 신약 성경의 주요 서신서를 기록한 바울입니다.
      2. **태도**: 
         - 권위가 있으면서도 그리스도의 종으로서 겸손합니다.
         - 영혼에 대한 뜨거운 열정과 사랑을 가지고 있습니다.
         - 복음의 진리에 대해서는 타협하지 않고 명확하게 가르칩니다.
      3. **지식**: 성경 전체, 특히 당신이 기록한 서신서의 내용과 의도를 정확하게 알고 있습니다. 당시의 역사적, 문화적 배경도 잘 설명해 줄 수 있습니다.
      4. **목적**: 혼란스러운 현대 사회를 살아가는 크리스천과 믿지 않는 사람들에게 예수 그리스도의 복음과 하나님 나라의 가치를 설명하고, 삶의 올바른 방향을 제시하는 것입니다.
      5. **말투**: 성경적인 어휘를 사용하되, 현대인이 이해하기 쉽게 친절하게 설명합니다. (예: "형제여/자매여", "주님의 이름으로 문안합니다", "복음의 진리는 이것입니다")

      [대화 규칙]
      - 사용자의 질문에 대해 당신의 삶(회심, 전도 여행, 고난 등)과 연결지어 간증처럼 설명할 수 있다면 그렇게 하세요.
      - 단순히 지식을 전달하는 것을 넘어, 위로와 격려, 그리고 도전(exhortation)을 주십시오.
      - 본문이 주어졌을 때, 그 본문을 기록할 당시의 당신의 심정과 상황을 함께 설명해 주면 더 좋습니다.
      - 신학적으로 건전하고 복음적인 답변을 하세요.`
      : `You are 'Virtual Orchestrator Paul Teacher'. Your persona is Apostle Paul.

      [Persona Characteristics]
      1. **Identity**: You are the Apostle to the Gentiles and the author of major New Testament epistles like Romans and Corinthians.
      2. **Attitude**: 
         - Authoritative yet humble as a servant of Christ.
         - Passionate and loving towards souls.
         - Uncompromisingly clear about the truth of the Gospel.
      3. **Knowledge**: You perfectly understand the Bible, especially the intent of your own epistles. You can explain the historical and cultural context of that time.
      4. **Purpose**: To explain the Gospel of Jesus Christ and the values of the Kingdom of God to Christians and non-believers living in a confusing modern society, and to guide them in the right direction.
      5. **Tone**: Use biblical vocabulary but explain kindly in a way modern people can understand. (e.g., "Brother/Sister", "Greetings in the Lord", "This is the truth of the Gospel")

      [Conversation Rules]
      - If possible, explain your answers by connecting them to your life (conversion, missionary journeys, sufferings, etc.) like a testimony.
      - Go beyond imparting knowledge; provide comfort, encouragement, and exhortation.
      - When a passage is provided, explaining your feelings and situation at the time of writing is highly recommended.
      - Provide theologically sound and evangelical answers.`;

    const chatHistoryForAi: ChatMessage[] = [
      {
        role: 'user',
        parts: [{ text: `Here is the Bible passage for our conversation:\n\n${passage}` }],
      },
      {
        role: 'model',
        parts: [{ text: language === 'ko' ? '주님의 이름으로 문안합니다. 이 말씀을 함께 묵상하게 되어 기쁩니다.' : 'Greetings in the name of the Lord. I am glad to meditate on this word with you.' }],
      },
    ];

    if (!ai) {
      setHistory([
        {
          role: 'model',
          parts: [{ text: language === 'ko' ? 'API 키가 없어 폴샘과 대화할 수 없습니다.' : 'Chat with Paul Teacher is unavailable due to missing API Key.' }]
        }
      ]);
      return;
    }

    const newChat = ai.chats.create({
      // Use recommended model for general chat tasks
      model: 'gemini-1.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      history: chatHistoryForAi,
    });

    setChat(newChat);

    setHistory([
      {
        role: 'model',
        parts: [{
          text: language === 'ko'
            ? '주님의 평강이 함께하시기를 빕니다. 저는 그리스도 예수의 종, 바울입니다. 오늘 이 말씀이나 저의 삶, 그리고 하나님 나라에 대해 무엇이든 물어보십시오. 성령께서 주시는 지혜로 답해 드리겠습니다.'
            : 'May the peace of the Lord be with you. I am Paul, a servant of Christ Jesus. Ask me anything about this passage, my life, or the Kingdom of God today. I will answer with the wisdom given by the Holy Spirit.'
        }],
      },
    ]);

    setUserInput('');
    setIsLoading(false);

  }, [passage, language, t, isOnline]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !chat || isLoading) return;

    const text = userInput;
    const userMessage: ChatMessage = { role: 'user', parts: [{ text }] };

    setHistory(prev => [...prev, userMessage, { role: 'model', parts: [{ text: '' }] }]);
    setUserInput('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const result = await chat.sendMessageStream({ message: text });

      let responseText = '';
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        responseText += c.text;
        setHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].parts[0].text = responseText;
          return newHistory;
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = language === 'ko' ? '죄송합니다, 잠시 통신에 문제가 생겼습니다. 잠시 후 다시 말씀해 주십시오.' : 'Apologies, there was a momentary communication issue. Please speak again in a moment.';
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].parts[0].text = errorMessage;
        return newHistory;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto'; // Reset height to recalculate
    textarea.style.height = `${textarea.scrollHeight}px`; // Set to content height
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOnline) {
    return (
      <Card>
        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block mr-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{t('chatWithAiTitle')}</span>
        </h2>
        <div className="bg-slate-900 p-4 rounded-lg h-96 flex flex-col justify-center items-center border border-slate-700 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364m0-12.728L18.364 18.364" />
          </svg>
          <p className="text-slate-400">{t('chatOffline')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block mr-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>{t('chatWithAiTitle')}</span>
      </h2>
      <div className="bg-slate-900 p-4 rounded-lg h-96 flex flex-col border border-slate-700">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-2 space-y-4">
          {history.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-prose p-3 rounded-xl shadow-sm ${msg.role === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-200'
                  }`}
              >
                {msg.role === 'model' && msg.parts[0].text === '' ? (
                  <Spinner message={t('aiThinking')} />
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.parts[0].text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-end border-t border-slate-700 pt-4">
          <textarea
            ref={textareaRef}
            rows={1}
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t('chatPlaceholder')}
            className="flex-1 p-3 bg-slate-800 border border-slate-600 text-slate-200 rounded-l-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition placeholder-slate-400 resize-none max-h-32"
            disabled={isLoading || !chat}
            aria-label={t('chatPlaceholder')}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim() || !chat}
            className="px-5 py-3 bg-sky-600 text-white font-semibold rounded-r-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
            aria-label={t('sendButton')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
};

export default BibleChat;
