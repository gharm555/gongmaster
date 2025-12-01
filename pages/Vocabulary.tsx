
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { TopBar, Button, Card, Badge, LoadingScreen } from '../components/UIComponents';
import { generateDailyVocab } from '../services/geminiService';
import { VocabItem, LoadingState } from '../types';

const TOPICS = ["내 단어장", "전체", "독해 빈출", "유의어/반의어", "숙어/이어동사", "생활영어", "법률/행정 어휘"];

const Vocabulary: React.FC = () => {
  const navigate = useNavigate();
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("내 단어장");

  const fetchVocab = async (topic: string) => {
    setLoadingState(LoadingState.LOADING);
    setExpandedIndex(null);
    try {
      const data = await generateDailyVocab(5, topic);
      setVocabList(data);
      setLoadingState(LoadingState.SUCCESS);
      
      // Update stats
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
    // Initial fetch
    if (vocabList.length === 0) {
      fetchVocab(selectedTopic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTopicChange = (topic: string) => {
    if (topic === selectedTopic) return;
    setSelectedTopic(topic);
    fetchVocab(topic);
  };

  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (loadingState === LoadingState.LOADING) {
    return (
      <div className="min-h-full bg-gray-50 pb-safe pt-safe">
        <TopBar title="오늘의 단어" onBack={() => navigate('/')} />
        <LoadingScreen message={`${selectedTopic}에서 핵심 단어를 선별하고 있습니다...`} />
      </div>
    );
  }

  if (loadingState === LoadingState.ERROR) {
    return (
      <div className="min-h-full bg-gray-50 flex flex-col pb-safe pt-safe">
        <TopBar title="오류 발생" onBack={() => navigate('/')} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-slate-600 mb-4">단어를 불러오는 중 문제가 발생했습니다.</p>
          <Button onClick={() => fetchVocab(selectedTopic)}>다시 시도하기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 pb-safe pt-safe">
      <TopBar title="오늘의 단어" onBack={() => navigate('/')} />
      
      <div className="sticky top-14 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-3 px-4">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicChange(topic)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedTopic === topic
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 space-y-4 pb-24">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-bold text-slate-800 text-lg">
            {selectedTopic} <span className="text-primary-600 font-normal text-base">학습 중</span>
          </h2>
          <span className="text-xs text-slate-400">총 5단어</span>
        </div>

        {vocabList.map((item, index) => (
          <Card 
            key={index} 
            className={`transition-all duration-300 ${expandedIndex === index ? 'ring-2 ring-primary-500 shadow-md scale-[1.01]' : ''}`}
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-800">{item.word}</h3>
                  <button 
                    onClick={(e) => handleSpeak(item.word, e)}
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 active:bg-slate-300 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-slate-400 text-sm font-mono block mt-0.5">{item.pronunciation}</span>
                <p className="text-lg font-medium text-primary-700 mt-2">{item.meaning}</p>
              </div>
              <div className={`transition-transform duration-300 text-slate-300 ml-4 ${expandedIndex === index ? 'rotate-180 text-primary-500' : ''}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            {expandedIndex === index && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">예문</span>
                  <div className="mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-slate-800 font-medium leading-relaxed">{item.exampleSentence}</p>
                    <p className="text-slate-500 text-sm mt-1">{item.exampleTranslation}</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">동의어</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.synonyms.map((syn, idx) => (
                      <Badge key={idx} color="bg-green-100 text-green-700">{syn}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}

        <div className="pt-6">
          <Button 
            variant="outline" 
            fullWidth 
            onClick={() => fetchVocab(selectedTopic)}
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            새로운 단어 생성하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Vocabulary;
