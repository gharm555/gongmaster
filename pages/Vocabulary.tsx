
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Volume2, RefreshCw, ChevronLeft, ChevronRight, Shuffle, ListOrdered, Timer, CheckCircle2, XCircle, Play, Settings, X, AlertCircle, Trash2 } from 'lucide-react';
import { TopBar, Button, Card, Badge, LoadingScreen } from '../components/UIComponents';
import { generateDailyVocab } from '../services/geminiService';
import { VocabItem, LoadingState } from '../types';
import { customVocabList, SimpleVocab, getDayRange } from '../data/vocabData';

interface QuizQuestion {
  word: SimpleVocab;
  options: string[];
  correctIndex: number;
}

interface QuizResult {
  word: SimpleVocab;
  isCorrect: boolean;
  selectedAnswer: string;
}

const Vocabulary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Main View State
  const [viewMode, setViewMode] = useState<'study' | 'quiz'>('study');
  
  // Study Mode State
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("내 단어장");
  const [learningMode, setLearningMode] = useState<'random' | 'sequential'>('sequential');
  
  // Day State
  const [selectedDay, setSelectedDay] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0); // This will track the actual index in the massive list
  const itemsPerPage = 5;

  // Quiz Mode State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [quizState, setQuizState] = useState<'intro' | 'playing' | 'result'>('intro');
  const [timeLeft, setTimeLeft] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [targetQuizCount, setTargetQuizCount] = useState(50);
  
  // Incorrect Words State
  const [incorrectWords, setIncorrectWords] = useState<SimpleVocab[]>([]);
  const [quizSource, setQuizSource] = useState<'normal' | 'incorrect'>('normal');

  // Check for navigation state to switch mode
  useEffect(() => {
    if (location.state && (location.state as any).mode === 'quiz') {
      setViewMode('quiz');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Load saved progress and incorrect words
  useEffect(() => {
    const savedProgress = localStorage.getItem('gongmaster_vocab_progress');
    if (savedProgress) {
      const { index, mode, day } = JSON.parse(savedProgress);
      if (index !== undefined) setCurrentIndex(index);
      if (mode) setLearningMode(mode);
      if (day) setSelectedDay(day);
    } else {
        // Initialize current index based on default day (1)
        const { start } = getDayRange(1);
        setCurrentIndex(start);
    }

    const savedIncorrect = localStorage.getItem('gongmaster_incorrect_vocab');
    if (savedIncorrect) {
      setIncorrectWords(JSON.parse(savedIncorrect));
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem('gongmaster_vocab_progress', JSON.stringify({
      index: currentIndex,
      mode: learningMode,
      day: selectedDay
    }));
  }, [currentIndex, learningMode, selectedDay]);

  // Save incorrect words whenever they change
  useEffect(() => {
    localStorage.setItem('gongmaster_incorrect_vocab', JSON.stringify(incorrectWords));
  }, [incorrectWords]);

  // Handle Day Change
  const handleDayChange = (day: number) => {
    if (day === selectedDay) return;
    setSelectedDay(day);
    const { start } = getDayRange(day);
    setCurrentIndex(start);
    setVocabList([]);
    // Immediately fetch vocab for the new day
    setTimeout(() => {
        if(viewMode === 'study') fetchVocab("내 단어장", 0, start);
    }, 0);
  };

  const fetchVocab = async (topic: string, indexOffset: number = 0, specificIndex: number = -1) => {
    setLoadingState(LoadingState.LOADING);
    setExpandedIndex(null);
    try {
      let data: VocabItem[] = [];

      if (topic === "내 단어장" && learningMode === 'sequential') {
        const { start, end } = getDayRange(selectedDay);
        
        // Use specificIndex if provided (e.g. Day switch), otherwise use currentIndex + offset
        let targetIndex = specificIndex !== -1 ? specificIndex : currentIndex + indexOffset;
        
        // Clamp targetIndex within the selected Day's range
        if (targetIndex < start) targetIndex = start;
        if (targetIndex >= end) targetIndex = Math.max(start, end - itemsPerPage); // Stay within range

        setCurrentIndex(targetIndex);

        const chunkEnd = Math.min(targetIndex + itemsPerPage, end);
        const selectedWords = customVocabList.slice(targetIndex, chunkEnd);
        
        if (selectedWords.length === 0) {
             // Handle case where day might be empty or error
             setLoadingState(LoadingState.SUCCESS);
             return;
        }

        data = await generateDailyVocab(itemsPerPage, topic, selectedWords);
      } else {
        data = await generateDailyVocab(itemsPerPage, topic);
      }

      setVocabList(data);
      setLoadingState(LoadingState.SUCCESS);
      
      const savedStats = localStorage.getItem('gongmaster_stats');
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        parsed.vocabLearned += data.length;
        localStorage.setItem('gongmaster_stats', JSON.stringify(parsed));
      }

    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
    }
  };

  useEffect(() => {
    if (viewMode === 'study' && vocabList.length === 0) {
      fetchVocab(selectedTopic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // --- Quiz Logic ---

  const startQuiz = (source: 'normal' | 'incorrect' = 'normal') => {
    setQuizSource(source);
    let targetWords: SimpleVocab[] = [];

    if (source === 'incorrect') {
        targetWords = [...incorrectWords].sort(() => 0.5 - Math.random());
        if (targetWords.length === 0) return;
    } else {
        // If "Sequential" (Day Mode), quiz only words from that Day
        if (learningMode === 'sequential' && selectedTopic === "내 단어장") {
            const { start, end, count } = getDayRange(selectedDay);
            const dayWords = customVocabList.slice(start, end);
            // Cap at day count or selected target count
            const quizSize = Math.min(targetQuizCount, count);
            targetWords = [...dayWords].sort(() => 0.5 - Math.random()).slice(0, quizSize);
        } else {
            // Random from entire list
            const quizSize = Math.min(targetQuizCount, customVocabList.length);
            targetWords = [...customVocabList].sort(() => 0.5 - Math.random()).slice(0, quizSize);
        }
    }

    const questions: QuizQuestion[] = targetWords.map(word => {
      const distractors = customVocabList
        .filter(w => w.word !== word.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(w => w.meaning);
      
      const options = [...distractors, word.meaning].sort(() => 0.5 - Math.random());
      return {
        word,
        options,
        correctIndex: options.indexOf(word.meaning)
      };
    });

    setQuizQuestions(questions);
    setQuizIndex(0);
    setQuizResults([]);
    setQuizState('playing');
    startTimer();
  };

  const startTimer = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    setTimeLeft(5);
    setSelectedOption(null);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleQuizAnswer(-1); // Time out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleQuizAnswer = (optionIndex: number) => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    if (selectedOption !== null && optionIndex !== -1) return;

    setSelectedOption(optionIndex);

    const currentQ = quizQuestions[quizIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;
    
    if (!isCorrect) {
        setIncorrectWords(prev => {
            if (prev.some(w => w.word === currentQ.word.word)) return prev;
            return [...prev, currentQ.word];
        });
    } else if (isCorrect && quizSource === 'incorrect') {
        setIncorrectWords(prev => prev.filter(w => w.word !== currentQ.word.word));
    }

    const result: QuizResult = {
      word: currentQ.word,
      isCorrect,
      selectedAnswer: optionIndex === -1 ? '(시간 초과)' : currentQ.options[optionIndex]
    };

    setQuizResults(prev => [...prev, result]);

    setTimeout(() => {
      if (quizIndex < quizQuestions.length - 1) {
        setQuizIndex(prev => prev + 1);
        startTimer();
      } else {
        setQuizState('result');
      }
    }, 1000);
  };

  const handleQuitQuiz = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    setQuizState('intro');
  };

  const handleModeToggle = () => {
    const newMode = learningMode === 'sequential' ? 'random' : 'sequential';
    setLearningMode(newMode);
    if (viewMode === 'study') {
       setVocabList([]);
       // Re-fetch appropriately
       if (newMode === 'sequential') {
           const { start } = getDayRange(selectedDay);
           fetchVocab(selectedTopic, 0, start); // Ensure we start at the Day's start index
       } else {
           fetchVocab(selectedTopic);
       }
    }
  };

  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // --- Render Helpers ---
  const getProgress = () => {
      if (learningMode !== 'sequential' || selectedTopic !== "내 단어장") return 0;
      const { start, count } = getDayRange(selectedDay);
      // Calculate relative progress within the day
      const relativeIndex = currentIndex - start;
      return Math.min(100, Math.max(0, (relativeIndex / count) * 100));
  };

  if (loadingState === LoadingState.LOADING && viewMode === 'study') {
    return (
      <div className="min-h-full bg-gray-50 pb-safe pt-safe">
        <TopBar title="오늘의 단어" onBack={() => navigate('/')} />
        <LoadingScreen message="AI가 학습 자료를 분석 중입니다..." />
      </div>
    );
  }

  const { start, end, count: dayCount } = getDayRange(selectedDay);

  return (
    <div className="min-h-full bg-gray-50 pb-safe pt-safe flex flex-col">
      <TopBar title="단어 마스터" onBack={() => navigate('/')} />
      
      {/* View Mode Toggle (Tabs) */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="bg-gray-100 p-1 rounded-xl flex relative">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out ${viewMode === 'study' ? 'left-1' : 'left-[calc(50%+4px)]'}`}
          />
          <button 
            onClick={() => setViewMode('study')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg relative z-10 transition-colors ${viewMode === 'study' ? 'text-primary-600' : 'text-slate-500'}`}
          >
            학습 모드
          </button>
          <button 
            onClick={() => setViewMode('quiz')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg relative z-10 transition-colors ${viewMode === 'quiz' ? 'text-orange-600' : 'text-slate-500'}`}
          >
            실전 테스트
          </button>
        </div>
      </div>

      {viewMode === 'study' && (
        <>
          <div className="sticky top-[56px] z-20 bg-gray-50 border-b border-gray-200">
            {/* Day Selector */}
            <div className="bg-white py-3 px-4 overflow-x-auto hide-scrollbar flex gap-2 flex-nowrap">
                {Array.from({ length: 50 }, (_, i) => i + 1).map((day) => (
                    <button
                        key={day}
                        onClick={() => handleDayChange(day)}
                        className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                            selectedDay === day 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        Day {day}
                    </button>
                ))}
            </div>
          </div>
          
          <div className="p-4 space-y-4 pb-24 flex-1 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  내 단어장
                  <button 
                    onClick={handleModeToggle}
                    className="text-xs font-normal px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center gap-1 transition-colors"
                  >
                    {learningMode === 'sequential' ? <ListOrdered className="w-3 h-3"/> : <Shuffle className="w-3 h-3"/>}
                    {learningMode === 'sequential' ? '순차 학습' : '무작위'}
                  </button>
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {learningMode === 'sequential'
                    ? `Day ${selectedDay} (${currentIndex - start + 1}~${Math.min(currentIndex + itemsPerPage - start, dayCount)} / ${dayCount})` 
                    : "5단어"}
                </span>
              </div>

              {learningMode === 'sequential' && (
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-primary-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${getProgress()}%` }}
                  ></div>
                </div>
              )}
            </div>

            {vocabList.map((item, index) => (
              <Card 
                key={index} 
                className={`transition-all duration-200 min-w-0 ${expandedIndex === index ? 'ring-2 ring-primary-500 shadow-md' : ''}`}
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex justify-between items-start min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-slate-800 break-words">{item.word}</h3>
                      <button 
                        onClick={(e) => handleSpeak(item.word, e)}
                        className="flex-shrink-0 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 active:bg-slate-300 transition-colors"
                        aria-label="듣기"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-slate-400 text-sm font-mono block mb-2">{item.pronunciation}</span>
                    <p className="text-lg font-medium text-primary-700 break-words">{item.meaning}</p>
                  </div>
                  <div className={`transition-transform duration-300 text-slate-300 ml-3 flex-shrink-0 mt-1 ${expandedIndex === index ? '-rotate-90 text-primary-500' : 'rotate-90'}`}>
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>

                {expandedIndex === index && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">예문</span>
                      <div className="mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-slate-800 font-medium leading-relaxed break-words">{item.exampleSentence}</p>
                        <p className="text-slate-500 text-sm mt-1 break-words">{item.exampleTranslation}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.synonyms.map((syn, idx) => (
                        <Badge key={idx} color="bg-green-100 text-green-700">{syn}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}

            <div className="pt-4 flex gap-3">
              {learningMode === 'sequential' ? (
                <>
                  <Button variant="secondary" className="flex-1" onClick={() => fetchVocab(selectedTopic, -itemsPerPage)} disabled={currentIndex <= start}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                  </Button>
                  <Button variant="primary" className="flex-[2]" onClick={() => fetchVocab(selectedTopic, itemsPerPage)} disabled={currentIndex + itemsPerPage >= end}>
                    다음 5개 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </>
              ) : (
                <Button variant="outline" fullWidth onClick={() => fetchVocab(selectedTopic)}>
                  <RefreshCw className="w-4 h-4 mr-2" /> 새로 고침
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {viewMode === 'quiz' && (
        <div className="p-4 h-full flex flex-col flex-1 overflow-hidden">
          {quizState === 'intro' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <Timer className="w-12 h-12 text-orange-600" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">스피드 단어 퀴즈</h2>
                <div className="text-slate-500">
                  <p>5초 안에 빠르게 정답을 맞춰보세요.</p>
                  <div className="text-slate-500 font-medium mt-2">총 단어 수: <span className="text-primary-600 font-bold">{customVocabList.length}개</span></div>
                </div>
              </div>

              <div className="w-full max-w-sm space-y-4">
                 {/* Quiz Settings */}
                 <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
                    <div className="flex justify-between items-center text-sm text-slate-600">
                        <span className="flex items-center gap-1 font-semibold"><Settings className="w-4 h-4" /> 문제 수 설정</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[25, 50, 100].map(count => (
                            <button
                                key={count}
                                onClick={() => setTargetQuizCount(count)}
                                className={`py-2 rounded-lg text-sm font-bold transition-all ${
                                    targetQuizCount === count 
                                    ? 'bg-orange-600 text-white shadow-md shadow-orange-200' 
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {count}문제
                            </button>
                        ))}
                    </div>
                 </div>

                 {/* Incorrect Word Quiz Option */}
                 <div className="bg-red-50 border border-red-100 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <span className="flex items-center gap-1.5 font-bold text-red-800 text-sm">
                            <AlertCircle className="w-4 h-4" /> 오답 노트
                        </span>
                        <Badge color="bg-red-200 text-red-800">{incorrectWords.length}개 저장됨</Badge>
                    </div>
                    <Button 
                        fullWidth 
                        variant="secondary"
                        onClick={() => startQuiz('incorrect')} 
                        disabled={incorrectWords.length === 0}
                        className={`text-sm py-2.5 h-auto ${incorrectWords.length === 0 ? 'opacity-50' : 'text-red-600 hover:bg-red-100 border-red-200'}`}
                    >
                        오답 집중 공략 {incorrectWords.length > 0 && <ChevronRight className="w-4 h-4 ml-1" />}
                    </Button>
                    <p className="text-xs text-red-400 mt-2 text-center">오답 퀴즈를 맞히면 목록에서 삭제됩니다.</p>
                 </div>

                 <Button fullWidth onClick={() => startQuiz('normal')} className="h-14 text-lg shadow-orange-200 shadow-xl bg-orange-600 hover:bg-orange-700">
                   <Play className="w-5 h-5 mr-2 fill-current" /> 
                   {learningMode === 'sequential' && selectedTopic === "내 단어장" ? `Day ${selectedDay} 복습 퀴즈` : "일반 퀴즈 시작"}
                 </Button>
                 <div className="text-center text-xs text-slate-400 font-medium">
                    {learningMode === 'sequential' && selectedTopic === "내 단어장" 
                        ? `현재 선택된 Day ${selectedDay} 범위 내에서 출제됩니다.` 
                        : '전체 범위에서 무작위로 출제됩니다.'}
                 </div>
              </div>
            </div>
          )}

          {quizState === 'playing' && quizQuestions.length > 0 && (
            <div className="flex-1 flex flex-col max-w-md mx-auto w-full py-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-400 font-medium">Question {quizIndex + 1} / {quizQuestions.length}</span>
                <div className="flex items-center gap-4">
                    <div className={`text-2xl font-black tabular-nums ${timeLeft <= 2 ? 'text-red-500 scale-110' : 'text-slate-700'} transition-all`}>
                    {timeLeft}s
                    </div>
                    <button 
                        onClick={handleQuitQuiz}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="그만두기"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
              </div>

              {/* Progress Bar for Timer */}
              <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 linear ${timeLeft <= 2 ? 'bg-red-500' : 'bg-orange-500'}`} 
                  style={{ width: `${(timeLeft / 5) * 100}%` }}
                ></div>
              </div>

              {quizSource === 'incorrect' && (
                 <div className="mb-4 text-center">
                    <Badge color="bg-red-100 text-red-700">오답 복습 중</Badge>
                 </div>
              )}

              <div className="flex-1 flex flex-col justify-center mb-10">
                <h1 className="text-4xl font-black text-slate-800 text-center mb-8 animate-in slide-in-from-bottom-2 break-words px-2">
                  {quizQuestions[quizIndex].word.word}
                </h1>

                <div className="grid grid-cols-1 gap-3">
                  {quizQuestions[quizIndex].options.map((option, idx) => {
                    let btnClass = "p-4 rounded-xl text-left font-medium border-2 transition-all active:scale-[0.98] ";
                    if (selectedOption !== null) {
                      if (idx === quizQuestions[quizIndex].correctIndex) {
                        btnClass += "border-green-500 bg-green-50 text-green-800";
                      } else if (idx === selectedOption) {
                        btnClass += "border-red-500 bg-red-50 text-red-800";
                      } else {
                         btnClass += "border-slate-100 bg-slate-50 text-slate-300";
                      }
                    } else {
                      btnClass += "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50 text-slate-700";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={selectedOption !== null}
                        onClick={() => handleQuizAnswer(idx)}
                        className={btnClass}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {quizState === 'result' && (
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-20 animate-in fade-in duration-500">
               <div className="text-center py-8">
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">퀴즈 결과</h2>
                 <div className="text-4xl font-black text-orange-600 mb-1">
                   {quizResults.filter(r => r.isCorrect).length} / {quizQuestions.length}
                 </div>
                 <p className="text-slate-500 text-sm mb-4">
                    정답률: {Math.round((quizResults.filter(r => r.isCorrect).length / quizQuestions.length) * 100)}%
                 </p>
                 {quizSource === 'incorrect' && (
                    <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {quizResults.filter(r => r.isCorrect).length}개 단어 마스터 완료! 🎉
                    </div>
                 )}
               </div>

               <div className="space-y-3">
                 {quizResults.map((res, idx) => (
                   <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${res.isCorrect ? 'bg-white border-slate-100' : 'bg-red-50 border-red-100'}`}>
                      <div className="mt-0.5">
                        {res.isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-lg">{res.word.word}</div>
                        <div className="text-sm text-slate-600 mt-1">{res.word.meaning}</div>
                        {!res.isCorrect && (
                          <div className="text-xs text-red-500 mt-2 font-medium">
                            선택: {res.selectedAnswer} <br/>
                            <span className="opacity-75">(오답 노트에 저장됨)</span>
                          </div>
                        )}
                        {res.isCorrect && quizSource === 'incorrect' && (
                            <div className="text-xs text-green-600 mt-2 font-medium">
                                오답 노트에서 삭제됨 ✨
                            </div>
                        )}
                      </div>
                   </div>
                 ))}
               </div>

               <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-200 p-4 mt-6">
                 <Button fullWidth onClick={() => setQuizState('intro')}>확인</Button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Vocabulary;
