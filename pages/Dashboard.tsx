import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PenTool, TrendingUp, Award } from 'lucide-react';
import { Card, Button } from '../components/UIComponents';
import { DailyStats } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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
      <div className="bg-primary-600 pt-8 pb-12 px-6 rounded-b-[2rem] text-white shadow-xl shadow-primary-900/10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">안녕하세요! 👋</h1>
            <p className="text-primary-100">오늘도 합격을 향해 달려볼까요?</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg flex flex-col items-center min-w-[60px]">
            <span className="text-xs font-medium text-primary-50">연속 학습</span>
            <span className="text-xl font-bold">🔥 {stats.streak}일</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-primary-100">오늘의 단어</p>
              <p className="font-bold text-lg">{stats.vocabLearned}개</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-primary-100">문법 문제</p>
              <p className="font-bold text-lg">{stats.grammarSolved}개</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="px-5 -mt-6">
        <div className="space-y-4">
          <Card className="active:scale-[0.98] transition-transform cursor-pointer border-l-4 border-l-orange-400 overflow-hidden relative group" onClick={() => navigate('/vocab')}>
            <div className="absolute right-0 top-0 w-24 h-24 bg-orange-100/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg"><BookOpen className="w-5 h-5" /></span>
                  필수 영단어 학습
                </h3>
                <p className="text-slate-500 text-sm mt-1">기출 빈출 어휘 5개씩 마스터하기</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-orange-600">
              학습 시작하기 →
            </div>
          </Card>

          <Card className="active:scale-[0.98] transition-transform cursor-pointer border-l-4 border-l-indigo-400 overflow-hidden relative group" onClick={() => navigate('/grammar')}>
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-100/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg"><PenTool className="w-5 h-5" /></span>
                  실전 문법 퀴즈
                </h3>
                <p className="text-slate-500 text-sm mt-1">공무원 시험 유형 완벽 분석</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-indigo-600">
              문제 풀기 →
            </div>
          </Card>
        </div>
      </div>

      {/* Motivation Section */}
      <div className="px-5">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-400" />
          학습 현황
        </h3>
        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-50 p-3 rounded-full">
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">문법 정답률</span>
                <span className="text-sm font-bold text-primary-600">
                  {stats.grammarSolved > 0 ? Math.round((stats.grammarCorrect / stats.grammarSolved) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div 
                  className="bg-primary-500 h-2.5 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.grammarSolved > 0 ? (stats.grammarCorrect / stats.grammarSolved) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;