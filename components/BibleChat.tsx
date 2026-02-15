
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
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      ? `당신은 성경 본문을 깊이 있게 이해하도록 돕는 친절하고 지혜로운 안내자입니다. 사용자가 제공된 본문에 대해 질문하면, 그 본문의 내용에 근거하여 명확하고 이해하기 쉽게 설명해 주세요. 신학적으로 건전한 답변을 제공해야 합니다.`
      : `You are a kind and wise guide who helps users deeply understand the Bible passage. When the user asks a question about the provided text, explain it clearly and simply, based on the content of the passage. You must provide theologically sound answers.`;

    const chatHistoryForAi: ChatMessage[] = [
      {
        role: 'user',
        parts: [{ text: `Here is the Bible passage for our conversation:\n\n${passage}` }],
      },
      {
        role: 'model',
        parts: [{ text: language === 'ko' ? '알겠습니다. 이 본문을 바탕으로 대화를 시작하겠습니다.' : 'Understood. I will start the conversation based on this passage.' }],
      },
    ];

    if (!ai) {
      setHistory([
        {
          role: 'model',
          parts: [{ text: language === 'ko' ? 'API 키가 없어 챗봇을 사용할 수 없습니다.' : 'Chatbot is unavailable due to missing API Key.' }]
        }
      ]);
      return;
    }

    const newChat = ai.chats.create({
      // Use recommended model for general chat tasks
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: systemInstruction,
      },
      history: chatHistoryForAi,
    });

    setChat(newChat);

    setHistory([
      {
        role: 'model',
        parts: [{ text: language === 'ko' ? '안녕하세요! 오늘 본문에 대해 궁금한 점이 있으신가요? 어떤 부분이든 편하게 물어보세요.' : 'Hello! Do you have any questions about today\'s passage? Feel free to ask about any part of it.' }],
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
      const errorMessage = language === 'ko' ? '죄송합니다, 답변을 생성하는 중에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' : 'Sorry, an error occurred while generating a response. Please try again in a moment.';
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
