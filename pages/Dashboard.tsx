
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PenTool, Timer, ArrowRight, Construction } from 'lucide-react';
import { Card } from '../components/UIComponents';
import { DailyStats } from '../types';

const SUBJECTS = [
  { id: 'korean', name: '국어' },
  { id: 'english', name: '영어' },
  { id: 'history', name: '한국사' },
  { id: 'law', name: '행정법' },
  { id: 'admin', name: '행정학' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeSubject, setActiveSubject] = useState('english');
  const [stats, setStats] = useState<DailyStats>({
    vocabLearned: 0,
    grammarSolved: 0,
    grammarCorrect: 0,
    streak: 1,
    lastLoginDate: new Date().toDateString(),
  });

  useEffect(() => {
    const savedStats = localStorage.getItem('gongmaster_stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  return (
    <div className="pb-20 space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-primary-600 pt-8 pb-16 px-6 rounded-b-[2.5rem] text-white shadow-xl shadow-primary-900/10 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">합격의 그날까지! 👋</h1>
            <p className="text-primary-100 text-sm mt-1">오늘도 목표를 향해 달려보세요.</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl flex flex-col items-center min-w-[64px] border border-white/10">
            <span className="text-[10px] font-medium text-primary-50 uppercase tracking-wider">Day</span>
            <span className="text-xl font-black">{stats.streak}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-primary-100 font-medium">오늘의 단어</p>
              <p className="font-bold text-lg">{stats.vocabLearned}개</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-primary-100 font-medium">문법 문제</p>
              <p className="font-bold text-lg">{stats.grammarSolved}개</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 -mt-8 relative z-20">
        
        {/* Subject Tabs */}
        <div className="bg-white p-1.5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex justify-between items-center mb-6 overflow-x-auto hide-scrollbar">
          {SUBJECTS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubject(sub.id)}
              className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeSubject === sub.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* Content based on Active Subject */}
        {activeSubject === 'english' ? (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
                오늘의 학습
              </h3>
            </div>

            {/* 1. Study Card */}
            <Card className="active:scale-[0.98] transition-all cursor-pointer border-0 ring-1 ring-slate-100 shadow-lg shadow-slate-200/40 bg-gradient-to-br from-white to-slate-50 relative group overflow-hidden" onClick={() => navigate('/vocab')}>
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex justify-between items-center p-1">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">필수 영단어 학습</h3>
                      <p className="text-slate-500 text-sm mt-1 font-medium">Day별 체계적 암기</p>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100">
                    <ArrowRight className="text-slate-400 w-5 h-5" />
                  </div>
                </div>
            </Card>

            <div className="pt-2 flex items-center justify-between px-1">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
                실전 트레이닝
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* 2. Vocab Quiz Card */}
                <Card className="active:scale-[0.98] transition-all cursor-pointer border-0 ring-1 ring-orange-100 bg-orange-50/30 hover:bg-orange-50 shadow-md shadow-orange-100/50" onClick={() => navigate('/vocab', { state: { mode: 'quiz' } })}>
                    <div className="flex flex-col items-center text-center py-3">
                        <div className="bg-orange-100 text-orange-600 p-3.5 rounded-2xl mb-3 shadow-inner">
                            <Timer className="w-7 h-7" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">스피드 퀴즈</h3>
                        <p className="text-xs text-orange-600/80 font-semibold mt-1">5초 순발력 테스트</p>
                    </div>
                </Card>

                {/* 3. Grammar Quiz Card */}
                <Card className="active:scale-[0.98] transition-all cursor-pointer border-0 ring-1 ring-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 shadow-md shadow-indigo-100/50" onClick={() => navigate('/grammar')}>
                    <div className="flex flex-col items-center text-center py-3">
                        <div className="bg-indigo-100 text-indigo-600 p-3.5 rounded-2xl mb-3 shadow-inner">
                            <PenTool className="w-7 h-7" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">실전 문법</h3>
                        <p className="text-xs text-indigo-600/80 font-semibold mt-1">기출 포인트 정리</p>
                    </div>
                </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Construction className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              <span className="text-primary-600">{SUBJECTS.find(s => s.id === activeSubject)?.name}</span> 과목 준비 중
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[200px]">
              더 완벽한 학습 콘텐츠를 위해<br/>열심히 준비하고 있습니다! 🚧
            </p>
            <button 
              onClick={() => setActiveSubject('english')}
              className="mt-8 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors"
            >
              영어 학습하러 가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
