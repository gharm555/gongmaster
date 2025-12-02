
import React from 'react';
import { Loader2, ChevronLeft } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  fullWidth, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 focus:ring-primary-500",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm focus:ring-slate-400",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${className}`}>
    {children}
  </div>
);

// --- Header/Nav Bar ---
export const TopBar: React.FC<{ title: string; onBack?: () => void }> = ({ title, onBack }) => (
  <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between">
    <div className="flex items-center gap-2">
      {onBack && (
        <button onClick={onBack} className="p-1 -ml-2 rounded-full hover:bg-slate-100">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
      )}
      <h1 className="font-bold text-lg text-slate-800">{title}</h1>
    </div>
  </div>
);

// --- Loading Screen ---
export const LoadingScreen: React.FC<{ message?: string }> = ({ message = "AI가 학습 자료를 준비 중입니다..." }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl">📚</span>
      </div>
    </div>
    <p className="mt-6 text-slate-600 font-medium animate-pulse">{message}</p>
    <p className="mt-2 text-sm text-slate-400">잠시만 기다려주세요 (약 5-10초)</p>
  </div>
);

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "bg-blue-100 text-blue-800" }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
    {children}
  </span>
);
