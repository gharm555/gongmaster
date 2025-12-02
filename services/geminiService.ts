
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { VocabItem, GrammarQuestion } from "../types";
import { customVocabList, SimpleVocab } from "../data/vocabData";

// Initialize Gemini Client
// Note: API Key must be provided via environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-2.5-flash';

// Helper function to get random items from an array
const getRandomItems = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const generateDailyVocab = async (count: number = 5, topic?: string, specificWords?: SimpleVocab[]): Promise<VocabItem[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        word: { type: Type.STRING, description: "The English word suitable for Korean civil service exams." },
        meaning: { type: Type.STRING, description: "Korean meaning of the word." },
        pronunciation: { type: Type.STRING, description: "Phonetic pronunciation guide (e.g., /.../)" },
        exampleSentence: { type: Type.STRING, description: "An example sentence using the word." },
        exampleTranslation: { type: Type.STRING, description: "Korean translation of the example sentence." },
        synonyms: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of 2-3 synonyms."
        },
      },
      required: ["word", "meaning", "pronunciation", "exampleSentence", "exampleTranslation", "synonyms"],
    },
  };

  let prompt = "";

  // 1. If specific words are provided (Sequential Mode)
  if (specificWords && specificWords.length > 0) {
    const wordListString = specificWords.map(w => `${w.word} (meaning: ${w.meaning})`).join(", ");
    prompt = `Create detailed vocabulary study cards for exactly these ${specificWords.length} words: 
    ${wordListString}.
    Use the provided Korean meanings as the primary definition.
    Generate a phonetic pronunciation, a helpful example sentence, the Korean translation of that sentence, and synonyms for each word.
    Strictly maintain the order of the words provided.`;
  } 
  // 2. Random selection from Custom List
  else if (topic === '내 단어장' || topic === 'Custom') {
    const selectedWords = getRandomItems(customVocabList, count);
    const wordListString = selectedWords.map(w => `${w.word} (meaning: ${w.meaning})`).join(", ");
    
    prompt = `Create detailed vocabulary study cards for the following specific words from the user's list: 
    ${wordListString}.
    Use the provided Korean meanings as the primary definition.
    Generate a phonetic pronunciation, a helpful example sentence, the Korean translation of that sentence, and synonyms for each word.`;
  } 
  // 3. Topic-based Random Generation
  else {
    const topicInstruction = topic && topic !== '전체' 
      ? `Focus strictly on vocabulary related to the category: "${topic}".` 
      : "Include a mix of high-frequency words from reading comprehension, synonyms, and idioms.";
      
    prompt = `Generate ${count} English vocabulary words specifically targeted for the Korean 9th/7th grade Civil Service Exam (공무원 시험). 
    ${topicInstruction}
    Ensure meanings are accurate for the exam context.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as VocabItem[];
    }
    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Error generating vocab:", error);
    throw error;
  }
};

export const generateGrammarQuiz = async (count: number = 3, topic?: string): Promise<GrammarQuestion[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Unique ID" },
        questionText: { type: Type.STRING, description: "The grammar question text, often with a blank or underlining." },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Array of 4 multiple choice options."
        },
        correctIndex: { type: Type.INTEGER, description: "Index (0-3) of the correct answer." },
        explanation: { type: Type.STRING, description: "Detailed explanation in Korean why the answer is correct and others are wrong." },
        topic: { type: Type.STRING, description: "Grammar topic (e.g., Subjunctive, Relative Clauses)." },
      },
      required: ["id", "questionText", "options", "correctIndex", "explanation", "topic"],
    },
  };

  const topicInstruction = topic && topic !== '전체'
    ? `Focus strictly on the grammar topic: "${topic}".`
    : "Include a mix of topics commonly found in the exam (e.g., Tenses, Relatives, Subjunctive, Participles).";

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Create ${count} English grammar multiple-choice questions tailored for the Korean Civil Service Exam (공무원 영어).
      The questions should mimic actual exam patterns (e.g., finding the grammatically correct sentence, filling in the blank).
      ${topicInstruction}
      Provide detailed explanations in Korean helpful for a student.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GrammarQuestion[];
    }
    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Error generating grammar quiz:", error);
    throw error;
  }
};
