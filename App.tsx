import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Vocabulary from './pages/Vocabulary';
import Grammar from './pages/Grammar';

// Simple initialization for stats if not present
const initStats = () => {
  if (!localStorage.getItem('gongmaster_stats')) {
    localStorage.setItem('gongmaster_stats', JSON.stringify({
      vocabLearned: 0,
      grammarSolved: 0,
      grammarCorrect: 0,
      streak: 1,
      lastLoginDate: new Date().toDateString(),
    }));
  }
};

const App: React.FC = () => {
  React.useEffect(() => {
    initStats();
  }, []);

  return (
    <Router>
      <div className="w-full h-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-y-auto hide-scrollbar relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vocab" element={<Vocabulary />} />
          <Route path="/grammar" element={<Grammar />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;