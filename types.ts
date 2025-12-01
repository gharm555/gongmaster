export interface VocabItem {
  word: string;
  meaning: string;
  pronunciation: string;
  exampleSentence: string;
  exampleTranslation: string;
  synonyms: string[];
}

export interface GrammarQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface DailyStats {
  vocabLearned: number;
  grammarSolved: number;
  grammarCorrect: number;
  streak: number;
  lastLoginDate: string;
}