'use client';

import { useState, useEffect } from 'react';
import { Award, Globe } from 'lucide-react';

export default function LanguageSelector({ onLanguageSelected }) {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('cig-bid-lang');
    if (!savedLang) {
      setShowOverlay(true);
    } else if (onLanguageSelected) {
      onLanguageSelected(savedLang);
    }
  }, [onLanguageSelected]);

  const selectLanguage = (lang) => {
    localStorage.setItem('cig-bid-lang', lang);
    setShowOverlay(false);
    if (onLanguageSelected) {
      onLanguageSelected(lang);
    }
  };

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#181820] to-[#101014] border border-amber-500/25 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl space-y-6">
        
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Award className="w-8 h-8 text-black" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-wide text-slate-100">
            Choose Language / भाषा चुनें
          </h2>
          <p className="text-xs text-slate-400">
            Please select your preferred language to proceed
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          <button
            onClick={() => selectLanguage('en')}
            className="w-full bg-slate-800 hover:bg-slate-700 hover:text-amber-400 text-slate-200 font-semibold py-3 rounded-lg border border-slate-700 hover:border-amber-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4 text-amber-500" /> English
          </button>
          
          <button
            onClick={() => selectLanguage('hi')}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4 text-black" /> हिन्दी (Hindi)
          </button>
        </div>

        <div className="text-[10px] text-slate-500">
          You can change your language preferences at any time in the portal.
        </div>

      </div>
    </div>
  );
}
