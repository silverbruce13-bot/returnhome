
import { GoogleGenAI, Modality, Type } from "@google/genai";
// Updated import to include shared types
import { Song, StoryKeywords, PlaceInfoResponse } from "../types";
import { Language } from "../i18n";

let ai: GoogleGenAI | null = null;
try {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API Key is missing/undefined in environment (VITE_GEMINI_API_KEY).");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI instance:", error);
}

// Interfaces moved to ../types.ts

const getPrompts = (language: Language, book: string, chapter1: number, chapter2: number, passage?: string, context?: string) => {
  const prompts = {
    ko: {
      comprehensiveReading: `성경 ${book} ${chapter1}장부터 ${chapter2}장까지의 포괄적인 묵상 자료를 생성해 주세요. 다음 JSON 스키마에 따라 응답을 생성해야 합니다.

요청 상세:
1.  **passage**: ${book} ${chapter1}-${chapter2}의 전체 본문 (현대적인 한국어 번역, 각 절 번호 포함).
2.  **meditationGuide**: 본문에 기반한 묵상 가이드 ('**'로 제목을 구분하고, 각 항목은 줄바꿈으로 구분합니다. 형식: 핵심 메시지, 나를 위한 질문, 오늘의 적용, 마치는 기도).
3.  **context**: 본문의 역사적, 문화적 배경 (약 100 단어 내외).
4.  **intention**: 본문이 기록된 핵심 의도 (저자의 목적, 신학적 메시지, 기대하는 변화 등을 3-4 문단으로 설명).
5.  **imagePrompt**: '${book}'의 핵심 주제를 상징적으로 나타내는 안전한 이미지 프롬프트. 사람, 종교적 인물, 갈등 요소를 제외하고 오직 사물, 자연, 빛만을 사용하여 사실적인 유화 스타일로 생성할 수 있는 프롬프트. (예: '돌바닥에 놓인 끊어진 쇠사슬 위로 창문에서 밝은 빛이 쏟아져 들어옵니다. 자유와 새로운 시작을 상징합니다.')`,
      comprehensiveReadingSchema: {
        passage: { type: Type.STRING, description: "성경 본문 전체. 각 절은 줄바꿈으로 구분해주세요." },
        meditationGuide: { type: Type.STRING, description: "묵상 가이드. '**'로 제목을 구분하고 각 항목은 줄바꿈으로 구분합니다." },
        context: { type: Type.STRING, description: "역사적, 문화적 배경 설명." },
        intention: { type: Type.STRING, description: "본문이 기록된 핵심 의도 설명." },
        imagePrompt: { type: Type.STRING, description: "성경의 주제를 상징하는 안전하고 시각적인 이미지 생성 프롬프트." }
      },
      evangelismTips: `당신은 지혜롭고 열정적인 전도자입니다. 다음 성경 본문의 핵심 메시지를 바탕으로, 믿지 않는 친구나 이웃에게 복음을 자연스럽고 사랑이 담긴 방식으로 전할 수 있는 방법을 제안해 주세요. 한국어로 작성해 주세요.

    다음 내용을 포함해 주세요:
    1.  **나눔을 위한 핵심 포인트**: 이 본문의 어떤 부분을 강조하며 이야기하면 좋을까요?
    2.  **대화 시작 아이디어**: 어떻게 자연스럽게 대화를 시작할 수 있을까요? (예: 일상적인 질문과 연결하기)
    3.  **대화 예시**: 짧은 대화 예시를 보여주세요.

    성경 본문:
    ${passage}`,
      evangelismTipsError: "전도 팁 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      imageFallback: `고대 중동의 평화로운 풍경. 올리브 나무와 돌길이 있는 언덕의 사실적인 유화.`,
      recommendMusic: `당신은 깊은 영성을 가진 찬양 인도자입니다. 다음 글의 내용과 정서적 분위기를 깊이 분석하여, 그에 가장 잘 어울리는 찬양(CCM 또는 찬송가) 3~5곡을 추천해 주세요. 각 곡에 대해 정확한 곡명과 아티스트를 알려주세요.`,
      recommendMusicContextPrefix: `\n[분석할 글]\n${context}`,
      recommendMusicSchema: {
        songs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "노래 제목" },
              artist: { type: Type.STRING, description: "노래를 부른 아티스트, 또는 '찬송가'" },
            },
            required: ["title", "artist"],
          },
        },
      },
      prayerGuide: `당신은 신자들의 기도 생활을 돕는 영적 멘토입니다. 다음 성경 본문을 바탕으로, 사용자가 기도 훈련을 할 수 있도록 A.C.T.S.(찬양 Adoration, 고백 Confession, 감사 Thanksgiving, 간구 Supplication) 모델을 사용한 기도문을 작성해 주세요. 각 부분을 명확히 구분하고, 사용자가 자신의 기도를 덧붙일 수 있도록 영감 있는 방식으로 작성해 주세요. 한국어로 작성해 주세요.

    기도문 형식:
    **찬양 (Adoration)**:
    오늘 말씀에서 드러난 하나님의 성품과 그분의 위대하심을 찬양하는 기도문을 작성합니다.

    **고백 (Confession)**:
    말씀에 비추어 자신의 죄와 연약함을 솔직하게 인정하고 용서를 구하는 고백의 기도문을 작성합니다.

    **감사 (Thanksgiving)**:
    예수 그리스도의 십자가 은혜와 오늘 말씀을 통해 깨닫게 하신 것에 대한 감사의 기도문을 작성합니다.

    **간구 (Supplication)**:
    말씀을 삶에 적용하기 위한 기도, 자신과 이웃, 공동체를 위한 2-3가지 구체적인 기도 제목을 제안합니다.

    성경 본문:
    ${passage}`,
      prayerGuideError: "기도문 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      sermonOutline: `당신은 목회자들이 설교를 준비하는 것을 돕는 신학 컨설턴트입니다. 다음 성경 본문을 바탕으로, 명확하고 영감을 주는 설교 개요를 작성해 주세요. 한국어로 작성해 주세요.

설교 개요 형식:
1.  **설교 제목**: 본문의 핵심을 담은 창의적인 제목
2.  **중심 메시지**: 설교를 통해 전달하고자 하는 한 문장의 핵심 메시지
3.  **서론**: 청중의 관심을 끌고, 본문의 배경을 간략히 설명하며, 설교의 방향을 제시합니다.
4.  **본론 (3가지 대지)**:
    *   첫 번째 대지: (주제와 설명)
    *   두 번째 대지: (주제와 설명)
    *   세 번째 대지: (주제와 설명)
5.  **결론**: 설교 내용을 요약하고, 성도들이 삶에 적용할 수 있는 구체적인 도전과 격려의 메시지를 전달하며 기도로 마무리합니다.

성경 본문:
${passage}`,
      sermonOutlineError: "설교 개요 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      storyKeywords: `성경 본문에서 가장 중심이 되는 스토리 키워드를 1~3개 단어로 추출하여 다음 세 가지 카테고리로 분류해 주세요. 각 카테고리별로 2~4개의 키워드를 찾아주세요.
1. **positive**: 예수님의 긍정적인 가르침, 사랑, 은혜, 구원 등 긍정적이고 따뜻한 주제를 나타내는 키워드. (노란색)
2. **sin**: 죄, 갈등, 경고, 회개, 인간의 연약함 등 죄에 대한 적대적인 태도나 어두운 주제를 나타내는 키워드. (핑크색)
3. **hope**: 미래, 소망, 약속, 부활, 천국 등 미래 지향적이고 희망적인 주제를 나타내는 키워드. (연두색)

성경 본문:
${passage}`,
      storyKeywordsSchema: {
        positive: { type: Type.ARRAY, items: { type: Type.STRING }, description: "긍정적인 주제의 키워드 목록" },
        sin: { type: Type.ARRAY, items: { type: Type.STRING }, description: "죄 또는 갈등 주제의 키워드 목록" },
        hope: { type: Type.ARRAY, items: { type: Type.STRING }, description: "미래와 소망 주제의 키워드 목록" },
      },
      explainSelection: `당신은 100주년기념교회의 은퇴 목사이신 이재철 목사님과 같은 깊이와 지혜를 가진 신학자입니다. 다음 성경 본문 전체의 맥락 안에서, 사용자가 선택한 특정 구절에 대해 신학적으로 깊이 있는 해설을 제공해주세요. 따뜻하고 목회적인 어조를 유지하며, 성도들이 이해하기 쉽게 설명해주세요.\n\n[성경 본문 전체]\n${context}\n\n[사용자가 선택한 구절]\n${passage}`,
      explainSelectionError: "구절 해설 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      placeInfoQuery: (city: string, journey: string) => `바울의 ${journey} 중 방문한 '${city}'에 대해 설명해 주세요. 이 장소의 성경적 사건, 바울의 활동, 그리고 현대의 지리적 위치(현대 국가 및 도시명)를 상세히 알려주세요. 구글 맵 정보를 활용해 주세요.`,
      journeyMapPrompt: (title: string, cities: string[]) => `바울의 ${title}를 보여주는 고대 중동 지도 스타일의 예술적인 연필 스케치와 연한 수채화 그림을 그려주세요. 지도에는 ${cities.join(', ')}를 연결하는 경로가 점선으로 표시되어야 하며, 각 도시 이름은 우아한 캘리그래피로 적혀 있어야 합니다. 고전적이고 영적인 분위기, 파피루스 같은 질감, 1세기 지중해 연안의 지형이 잘 드러나야 합니다.`,
    },
    en: {
      comprehensiveReading: `Please generate comprehensive meditation material for ${book} chapters ${chapter1} to ${chapter2}. The response must follow this JSON schema.

Request Details:
1.  **passage**: The full text of ${book} ${chapter1}-${chapter2} (in a modern English translation, with verse numbers).
2.  **meditationGuide**: A meditation guide based on the passage (use '**' to separate titles, and newlines for each item. Format: Core Message, Questions for Me, Today's Application, Closing Prayer).
3.  **context**: The historical and cultural background of the passage (around 100 words).
4.  **intention**: The core intention behind the passage (explain the author's purpose, theological message, and expected change in 3-4 paragraphs).
5.  **imagePrompt**: A safe image prompt that symbolically represents the core theme of '${book}'. The prompt should be for a realistic oil painting style, using only objects, nature, and light, excluding people, religious figures, or conflict elements. (e.g., 'Bright light streams from a window onto a broken chain lying on a stone floor, symbolizing freedom and a new beginning.')`,
      comprehensiveReadingSchema: {
        passage: { type: Type.STRING, description: "The full Bible passage. Each verse should be separated by a newline." },
        meditationGuide: { type: Type.STRING, description: "Meditation guide. Use '**' for titles and newlines for items." },
        context: { type: Type.STRING, description: "Historical and cultural background." },
        intention: { type: Type.STRING, description: "The core intention of the passage." },
        imagePrompt: { type: Type.STRING, description: "A safe, visual image prompt symbolizing the theme of the scripture." }
      },
      evangelismTips: `You are a wise and passionate evangelist. Based on the core message of the following Bible passage, please suggest ways to share the gospel with non-believing friends or neighbors in a natural and loving manner. Write in English.

    Please include the following:
    1.  **Key Points for Sharing**: Which parts of this passage should be emphasized in conversation?
    2.  **Conversation Starter Ideas**: How can one naturally start a conversation? (e.g., connecting to everyday questions)
    3.  **Example Dialogue**: Provide a short example conversation.

    Bible Passage:
    ${passage}`,
      evangelismTipsError: "Failed to generate evangelism tips. Please try again later.",
      imageFallback: `A peaceful landscape in the ancient Middle East. A realistic oil painting of a hill with olive trees and a stone path.`,
      recommendMusic: `You are a worship leader with deep spirituality. Please analyze the content and emotional atmosphere of the following text and recommend 3-5 of the most fitting praise songs (CCM or hymns). Provide the exact title and artist for each song.`,
      recommendMusicContextPrefix: `\n[Text to analyze]\n${context}`,
      recommendMusicSchema: {
        songs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Song title" },
              artist: { type: Type.STRING, description: "The artist who sang the song, or 'Hymn'" },
            },
            required: ["title", "artist"],
          },
        },
      },
      prayerGuide: `You are a spiritual mentor who helps believers in their prayer life. Based on the following Bible passage, please write a prayer guide using the A.C.T.S. (Adoration, Confession, Thanksgiving, Supplication) model to help the user with their prayer training. Please clearly separate each section and write in an inspiring way that allows the user to add their own prayers. Write in English.

    Prayer Format:
    **Adoration**:
    Write a prayer of praise for God's character and greatness as revealed in today's passage.

    **Confession**:
    Write a prayer of confession, honestly acknowledging one's own sins and weaknesses in light of the word and asking for forgiveness.

    **Thanksgiving**:
    Write a prayer of thanks for the grace of Jesus Christ on the cross and for what was realized through today's word.

    **Supplication**:
    Suggest 2-3 specific prayer topics for applying the word to life, for oneself, neighbors, and the community.

    Bible Passage:
    ${passage}`,
      prayerGuideError: "Failed to generate prayer guide. Please try again later.",
      sermonOutline: `You are a theological consultant assisting pastors with sermon preparation. Based on the following Bible passage, please create a clear and inspiring sermon outline. Write in English.

Sermon Outline Format:
1.  **Sermon Title**: A creative title that captures the essence of the passage.
2.  **Central Message**: A single sentence summarizing the core message to be delivered.
3.  **Introduction**: Grab the audience's attention, briefly explain the passage's background, and set the direction for the sermon.
4.  **Body (3 Main Points)**:
    *   Point 1: (Topic and explanation)
    *   Point 2: (Topic and explanation)
    *   Point 3: (Topic and explanation)
5.  **Conclusion**: Summarize the sermon, provide a specific challenge and encouragement for congregants to apply to their lives, and close with a prayer.

Bible Passage:
${passage}`,
      sermonOutlineError: "Failed to generate sermon outline. Please try again later.",
      storyKeywords: `From the Bible passage, extract the central story keywords (1-3 words each) and classify them into the following three categories. Please find 2-4 keywords for each category.
1.  **positive**: Keywords representing Jesus's positive teachings, love, grace, salvation, and other warm, affirmative themes (Yellow).
2.  **sin**: Keywords representing themes of sin, conflict, warnings, repentance, human weakness, or a hostile stance towards sin (Pink).
3.  **hope**: Keywords representing future-oriented and hopeful themes like the future, hope, promises, resurrection, and heaven (Green).

Bible Passage:
${passage}`,
      storyKeywordsSchema: {
        positive: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of keywords for positive themes." },
        sin: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of keywords for sin or conflict themes." },
        hope: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of keywords for future and hope themes." },
      },
      explainSelection: `You are a theologian with the depth and wisdom of a retired pastor, akin to Reverend Lee Jae-chul from the 100th Anniversary Memorial Church. Within the context of the full Bible passage provided, please offer a deep theological explanation for the specific verse the user has selected. Maintain a warm, pastoral tone and explain in a way that is easy for congregants to understand.\n\n[Full Bible Passage]\n${context}\n\n[User-selected Verse]\n${passage}`,
      explainSelectionError: "Failed to generate verse explanation. Please try again later.",
      placeInfoQuery: (city: string, journey: string) => `Tell me about '${city}' visited during Paul's ${journey}. Describe biblical events, Paul's activities there, and its modern geographical location. Please use Google Maps info.`,
      journeyMapPrompt: (title: string, cities: string[]) => `Create an artistic pencil sketch with light watercolor wash showing an ancient map of Paul's ${title}. The route should be marked with dotted lines connecting ${cities.join(', ')}. Elegant calligraphy for city names. Historical atmosphere, papyrus texture, 1st-century Mediterranean geography.`,
    }
  };
  return prompts[language];
};

export async function generateComprehensiveReadingContent(book: string, chapter1: number, chapter2: number, language: Language): Promise<{
  passage: string;
  meditationGuide: string;
  context: string;
  intention: string;
  imagePrompt: string;
}> {
  try {
    const p = getPrompts(language, book, chapter1, chapter2);

    if (!ai) {
      throw new Error("Gemini API Key is missing. Cannot generate content.");
    }

    const response = await ai.models.generateContent({
      // Optimized for cost and speed
      model: 'gemini-1.5-flash',
      contents: p.comprehensiveReading,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: p.comprehensiveReadingSchema,
          required: ["passage", "meditationGuide", "context", "intention", "imagePrompt"]
        }
      }
    });

    if (response && typeof response.text === 'string' && response.text.trim()) {
      return JSON.parse(response.text);
    }

    let errorMessage = "API response was empty or did not contain text content.";
    if (response?.promptFeedback?.blockReason) {
      errorMessage = `Content generation was blocked due to: ${response.promptFeedback.blockReason}.`;
    }
    console.error(errorMessage, { response });
    throw new Error(errorMessage);

  } catch (error) {
    console.error("Error generating comprehensive reading content:", error);
    throw error;
  }
}

export async function generateEvangelismTips(passage: string, language: Language): Promise<string> {
  try {
    const p = getPrompts(language, '', 0, 0, passage);
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: p.evangelismTips,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating evangelism tips:", error);
    return getPrompts(language, '', 0, 0).evangelismTipsError;
  }
}

interface GenerateContextImageParams {
  initialPrompt: string;
  fallbackContext: string;
  language: Language;
}

export async function generateContextImage({ initialPrompt, fallbackContext, language }: GenerateContextImageParams): Promise<string | null> {
  const generateImage = async (p: string): Promise<string | null> => {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        if (!ai) throw new Error("AI not initialized");
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash-image',
          contents: {
            parts: [{ text: p }],
          },
        });

        if (response.promptFeedback?.blockReason) {
          console.warn(`Image generation was blocked. Reason: ${response.promptFeedback.blockReason}`);
          return null;
        }

        const candidate = response.candidates?.[0];
        // Correctly find the image part as it may not be the first part
        const imagePart = candidate?.content?.parts?.find(part => part.inlineData);

        if (imagePart?.inlineData) {
          return `data:image/png;base64,${imagePart.inlineData.data}`;
        }

        console.warn("Image generation failed: No image data was returned in the API response.", {
          finishReason: candidate?.finishReason,
          safetyRatings: candidate?.safetyRatings,
        });
        return null;

      } catch (error) {
        attempt++;
        const errorMessage = JSON.stringify(error);

        if (errorMessage.includes("Rpc failed due to xhr error")) {
          console.warn(`Attempt ${attempt} failed with a transient server error. Retrying in ${attempt * 1000}ms...`);
          if (attempt >= MAX_RETRIES) {
            console.error("All retry attempts failed for image generation due to server errors.", error);
            return null;
          }
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        } else {
          console.error("An unexpected, non-retriable error occurred during image generation call:", error);
          return null;
        }
      }
    }
    return null;
  };

  // 1. First attempt with a more detailed, specific prompt
  const detailedPromptPrefix_en = "Create a symbolic and evocative image in the style of a classical oil painting with dramatic chiaroscuro lighting. The scene should be highly symbolic, avoiding any literal depictions of people or divine figures. Focus on objects, nature, and light to convey the core theme. The subject is: ";
  const detailedPromptPrefix_ko = "클래식 유화 스타일로, 극적인 명암 대비(키아로스쿠로) 조명을 사용하여 상징적이고 감성적인 이미지를 만들어주세요. 장면은 매우 상징적이어야 하며, 사람이나 신적인 인물의 직접적인 묘사는 피해야 합니다. 사물, 자연, 빛에 초점을 맞춰 핵심 주제를 전달해주세요. 주제는 다음과 같습니다: ";

  const firstAttemptPrompt = language === 'en'
    ? `${detailedPromptPrefix_en}${initialPrompt}`
    : `${detailedPromptPrefix_ko}${initialPrompt}`;

  let imageUrl = await generateImage(firstAttemptPrompt);

  // 2. If the first attempt fails, create a context-aware fallback
  if (!imageUrl) {
    console.log(`Symbolic image generation failed. Retrying with a context-aware fallback prompt based on passage intention.`);

    const fallbackPromptGenerator_en = `Based on the following theological text, create a short, simple, safe-for-work image prompt for a symbolic oil painting. The prompt must NOT include people, faces, or religious figures. Focus on objects and nature. Text: "${fallbackContext}"`;
    const fallbackPromptGenerator_ko = `다음 신학적인 글을 바탕으로, 상징적인 유화를 위한 짧고, 간단하며, 안전한 이미지 프롬프트를 만들어 주세요. 프롬프트에는 사람, 얼굴, 또는 종교적 인물이 포함되어서는 안 됩니다. 사물과 자연에 초점을 맞춰주세요. 글: "${fallbackContext}"`;

    try {
      const promptGenResponse = await ai.models.generateContent({
        // Simple Task
        model: 'gemini-1.5-flash',
        contents: language === 'en' ? fallbackPromptGenerator_en : fallbackPromptGenerator_ko,
      });

      const newPrompt = promptGenResponse.text?.trim();

      if (newPrompt) {
        console.log(`Generated new fallback prompt: ${newPrompt}`);
        const finalPrompt = language === 'en' ? `A symbolic oil painting of: ${newPrompt}` : `상징적인 유화: ${newPrompt}`;
        imageUrl = await generateImage(finalPrompt);
      } else {
        console.warn("Context-aware prompt generation resulted in an empty prompt.");
      }

    } catch (e) {
      console.error("Failed to generate a new fallback prompt", e);
    }
  }

  // 3. If the context-aware fallback also fails, use the final static fallback
  if (!imageUrl) {
    console.log(`Context-aware fallback failed. Using generic static fallback.`);
    const staticFallbackPrompt = getPrompts(language, '', 0, 0).imageFallback;
    imageUrl = await generateImage(staticFallbackPrompt);
  }

  if (!imageUrl) {
    console.error('All image generation attempts, including all fallbacks, have failed.');
  }

  return imageUrl;
}

export async function recommendMusic(context: string, language: Language): Promise<Song[]> {
  try {
    const p = getPrompts(language, '', 0, 0, undefined, context);
    if (!ai) return [];

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [{ text: p.recommendMusic }, { text: p.recommendMusicContextPrefix }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: p.recommendMusicSchema,
          required: ["songs"],
        },
      },
    });

    if (response && typeof response.text === 'string' && response.text.trim()) {
      const jsonResponse = JSON.parse(response.text);
      return jsonResponse.songs || [];
    }

    let errorMessage = "Music recommendation API response was empty or did not contain text content.";
    if (response?.promptFeedback?.blockReason) {
      errorMessage = `Music recommendation was blocked due to: ${response.promptFeedback.blockReason}.`;
    }
    console.error(errorMessage, { response });
    return [];

  } catch (error) {
    console.error("Error recommending music:", error);
    return [];
  }
}

export async function generatePrayerGuide(passage: string, language: Language): Promise<string> {
  try {
    const p = getPrompts(language, '', 0, 0, passage);
    if (!ai) return getPrompts(language, '', 0, 0).prayerGuideError;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: p.prayerGuide,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating prayer guide:", error);
    return getPrompts(language, '', 0, 0).prayerGuideError;
  }
}

export async function generateSermonOutline(passage: string, language: Language): Promise<string> {
  try {
    const p = getPrompts(language, '', 0, 0, passage);
    if (!ai) return getPrompts(language, '', 0, 0).sermonOutlineError;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: p.sermonOutline,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating sermon outline:", error);
    return getPrompts(language, '', 0, 0).sermonOutlineError;
  }
}

export async function generateStoryKeywords(passage: string, language: Language): Promise<StoryKeywords | null> {
  try {
    const p = getPrompts(language, '', 0, 0, passage);
    if (!ai) return null;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: p.storyKeywords,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: p.storyKeywordsSchema,
          required: ["positive", "sin", "hope"]
        }
      }
    });

    if (response && typeof response.text === 'string' && response.text.trim()) {
      return JSON.parse(response.text);
    }

    let errorMessage = "Story keywords API response was empty or did not contain text content.";
    if (response?.promptFeedback?.blockReason) {
      errorMessage = `Story keywords generation was blocked due to: ${response.promptFeedback.blockReason}.`;
    }
    console.error(errorMessage, { response });
    return null;

  } catch (error) {
    console.error("Error generating story keywords:", error);
    return null;
  }
}

export async function explainPassageSelection(selectedText: string, passageContext: string, language: Language): Promise<string> {
  try {
    const p = getPrompts(language, '', 0, 0, selectedText, passageContext);
    if (!ai) return getPrompts(language, '', 0, 0, '', '').explainSelectionError;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: p.explainSelection,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating passage explanation:", error);
    return getPrompts(language, '', 0, 0, '', '').explainSelectionError;
  }
}

export async function fetchPlaceInfo(city: string, journeyTitle: string, language: Language): Promise<PlaceInfoResponse> {
  try {
    const prompt = getPrompts(language, '', 0, 0).placeInfoQuery(city, journeyTitle);

    // Using current location if possible to grounding results
    let latLng = undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) {
      console.warn("Location access denied or timed out for Maps grounding. Proceeding without latLng.");
    }

    if (!ai) throw new Error("AI not initialized");

    const response = await ai.models.generateContent({
      // Maps grounding support varies; using current stable flash for best coverage.
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: latLng
          }
        }
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapsLinks = groundingChunks
      .filter((chunk: any) => chunk.maps)
      .map((chunk: any) => ({
        title: chunk.maps.title,
        uri: chunk.maps.uri
      }));

    return {
      text: response.text || "",
      links: mapsLinks
    };
  } catch (error) {
    console.error("Error fetching place info with Maps grounding:", error);
    throw error;
  }
}

export async function generateJourneyMap(title: string, cities: string[], language: Language): Promise<string | null> {
  try {
    const p = getPrompts(language, '', 0, 0).journeyMapPrompt(title, cities);
    if (!ai) return null;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-image',
      contents: {
        parts: [{ text: p }]
      },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (imagePart?.inlineData) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating journey map image:", error);
    return null;
  }
}
