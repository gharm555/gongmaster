import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, HelpCircle } from 'lucide-react';
import { TopBar, Button, Card, Badge, LoadingScreen } from '../components/UIComponents';
import { generateGrammarQuiz } from '../services/geminiService';
import { GrammarQuestion, LoadingState } from '../types';

const TOPICS = ["전체", "문장의 구조", "시제/태", "준동사", "관계사/접속사", "가정법", "일치/화법"];

const Grammar: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [selectedTopic, setSelectedTopic] = useState("전체");

  const fetchQuiz = async (topic: string) => {
    setLoadingState(LoadingState.LOADING);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    
    try {
      const data = await generateGrammarQuiz(3, topic); // Fetch 3 questions at a time
      setQuestions(data);
      setLoadingState(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
    }
  };

  useEffect(() => {
    fetchQuiz(selectedTopic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTopicChange = (topic: string) => {
    if (topic === selectedTopic) return;
    setSelectedTopic(topic);
    fetchQuiz(topic);
  };

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);

    // Update stats
    const savedStats = localStorage.getItem('gongmaster_stats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      parsed.grammarSolved += 1;
      if (index === questions[currentIndex].correctIndex) {
        parsed.grammarCorrect += 1;
      }
      localStorage.setItem('gongmaster_stats', JSON.stringify(parsed));
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Completed current set
      fetchQuiz(selectedTopic);
    }
  };

  if (loadingState === LoadingState.LOADING) {
    return (
      <div className="min-h-full bg-gray-50 pb-safe pt-safe">
        <TopBar title="실전 문법" onBack={() => navigate('/')} />
        <LoadingScreen message={`${selectedTopic} 유형의 고난도 문제를 출제하고 있습니다...`} />
      </div>
    );
  }

  if (loadingState === LoadingState.ERROR || questions.length === 0) {
    return (
      <div className="min-h-full bg-gray-50 flex flex-col pb-safe pt-safe">
        <TopBar title="오류" onBack={() => navigate('/')} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-slate-600 mb-4">문제를 불러오지 못했습니다.</p>
          <Button onClick={() => fetchQuiz(selectedTopic)}>다시 시도하기</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedOption === currentQuestion.correctIndex;

  return (
    <div className="min-h-full bg-gray-50 pb-safe pt-safe">
      <TopBar title={`문법 퀴즈 (${currentIndex + 1}/${questions.length})`} onBack={() => navigate('/')} />
      
      <div className="sticky top-14 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-3 px-4">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicChange(topic)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedTopic === topic
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto pb-24">
        <div className="mb-4 flex justify-between items-center">
          <Badge color="bg-indigo-100 text-indigo-700">{currentQuestion.topic}</Badge>
          <span className="text-xs text-slate-400">AI 출제 문제</span>
        </div>
        
        <Card className="mb-6 border-l-4 border-l-indigo-500 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 leading-relaxed">
            {currentQuestion.questionText}
          </h3>
        </Card>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            let itemClass = "w-full p-4 rounded-xl text-left border-2 transition-all duration-200 ";
            
            if (isAnswered) {
              if (index === currentQuestion.correctIndex) {
                itemClass += "border-green-500 bg-green-50 text-green-900 shadow-sm";
              } else if (index === selectedOption) {
                itemClass += "border-red-500 bg-red-50 text-red-900";
              } else {
                itemClass += "border-slate-100 bg-white text-slate-400 opacity-60";
              }
            } else {
              itemClass += "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] text-slate-700";
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={isAnswered}
                className={itemClass}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                      isAnswered && index === currentQuestion.correctIndex ? 'bg-green-500 border-green-500 text-white' : 
                      isAnswered && index === selectedOption ? 'bg-red-500 border-red-500 text-white' :
                      'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className={`p-5 rounded-2xl mb-6 shadow-sm border ${isCorrect ? 'bg-green-50 border-green-100 text-green-900' : 'bg-red-50 border-red-100 text-red-900'}`}>
              <div className="flex items-center gap-2 font-bold text-lg mb-2">
                {isCorrect ? <Check className="w-6 h-6 text-green-600" /> : <X className="w-6 h-6 text-red-600" />}
                {isCorrect ? '정답입니다!' : '오답입니다.'}
              </div>
              <div className="bg-white/60 p-4 rounded-xl mt-2 text-sm leading-relaxed backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 mt-0.5 opacity-70 shrink-0" />
                  <span>{currentQuestion.explanation}</span>
                </div>
              </div>
            </div>

            <Button onClick={handleNext} fullWidth className="h-14 text-lg shadow-xl shadow-indigo-200">
              {currentIndex < questions.length - 1 ? '다음 문제' : '새로운 문제 세트 받기'} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Grammar;