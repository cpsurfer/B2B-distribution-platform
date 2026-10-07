'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, Award, Lock, ArrowRight, Truck, ClipboardCheck, Globe, Menu, X } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import { translations } from '@/lib/translations';

export default function LandingPage() {
  const [lang, setLang] = useState('en');
  const [menuOpen, setMenuOpen] = useState(false);

  // Load language from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cig-bid-lang');
    if (saved) setLang(saved);
  }, []);

  const t = translations[lang] || translations.en;

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    localStorage.setItem('cig-bid-lang', nextLang);
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-[#0c0c0e] via-[#141419] to-[#08080a] text-slate-100 font-sans flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Language Selector Overlay */}
      <LanguageSelector onLanguageSelected={setLang} />

      {/* Top Header */}
      <header className="border-b border-amber-950/20 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4 max-w-7xl w-full mx-auto">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-2 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-black tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent whitespace-nowrap">
                {t.brandTitle}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold whitespace-nowrap">
                {t.b2bOnly}
              </span>
            </div>
          </div>
          
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="text-xs bg-slate-800/80 hover:bg-slate-700 text-amber-400 font-bold px-3 py-2 rounded-lg border border-slate-700 hover:border-amber-500/30 transition-all flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'हिन्दी' : 'English'}
            </button>

            <Link
              href="/login"
              className="text-sm font-semibold text-slate-300 hover:text-amber-400 transition-colors"
            >
              {t.signIn}
            </Link>
            
            <Link
              href="/login?tab=register"
              className="text-sm font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-4 py-2 rounded-lg shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t.applyAccess}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="text-xs bg-slate-800/80 hover:bg-slate-700 text-amber-400 font-bold p-1.5 rounded-lg border border-slate-700 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-slate-300 hover:text-amber-400 p-2 focus:outline-none"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {menuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-800/60 flex flex-col gap-3.5">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-semibold text-slate-300 hover:text-amber-400 py-2 border-b border-slate-900"
            >
              {t.signIn}
            </Link>
            <Link
              href="/login?tab=register"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-4 py-2.5 rounded-lg text-center shadow-lg"
            >
              {t.applyAccess}
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center flex-1">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
            <Lock className="w-3.5 h-3.5" /> {t.restrictedPortal}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            {lang === 'en' ? 'Exclusive Wholesale Portal' : 'विशेष थोक व्यापार पोर्टल'}{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              {lang === 'en' ? 'for Shops & Wholesalers' : 'दुकानदारों और वितरकों के लिए'}
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
            {t.landingSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="/login?tab=register"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-3.5 rounded-lg shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-amber-500/30 hover:scale-[1.02] transition-all duration-200 group"
            >
              {t.applyAccess}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 font-semibold px-6 py-3.5 rounded-lg transition-all"
            >
              {t.signIn}
            </Link>
          </div>

          {/* Quick Stats/Badges */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/60 max-w-md">
            <div>
              <p className="text-2xl font-bold text-amber-400">10K+</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                {lang === 'en' ? 'Shops Onboarded' : 'पंजीकृत दुकानें'}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">COD</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                {lang === 'en' ? 'Pay on Delivery' : 'डिलीवरी पर कैश'}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">GPS</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                {lang === 'en' ? 'Live Routing' : 'सटीक GPS ट्रैकिंग'}
              </p>
            </div>
          </div>
        </div>

        {/* Visual Showcase Card */}
        <div className="relative flex justify-center items-center">
          {/* Decorative gradients */}
          <div className="absolute w-72 h-72 bg-amber-600/10 rounded-full blur-[80px] -top-10 -left-10 animate-pulse"></div>
          <div className="absolute w-72 h-72 bg-amber-500/10 rounded-full blur-[80px] -bottom-10 -right-10 animate-pulse"></div>

          <div className="bg-gradient-to-b from-[#181820]/90 to-[#101014]/90 border border-slate-800/80 p-8 rounded-2xl shadow-2xl relative backdrop-blur-md max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800/80 pb-4 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" /> {t.wholesalerBenefits}
            </h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-amber-500/10 text-amber-400 p-2.5 h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-amber-500/20">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">
                    {lang === 'en' ? 'Registration for Small Shops' : 'छोटे दुकानदारों के लिए पंजीकरण'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {lang === 'en' ? 'Apply with just your Phone Number and Location address. No complex tax registration required.' : 'बिना टैक्स आईडी के केवल फ़ोन नंबर और पते के साथ आवेदन करें।'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-amber-500/10 text-amber-400 p-2.5 h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">
                    {lang === 'en' ? 'GPS Delivery Routing' : 'GPS डिलीवरी रूटिंग'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {lang === 'en' ? 'Exact location coordinates are captured during ordering for faster dispatch and accurate warehouse deliveries.' : 'सटीक डिलीवरी के लिए ऑर्डर प्लेस करते समय आपकी लाइव लोकेशन ली जाती है।'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-amber-500/10 text-amber-400 p-2.5 h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-amber-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">
                    {lang === 'en' ? 'Verification Gated' : 'सत्यापन सुरक्षा'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {lang === 'en' ? 'All prices and checkout logs are protected behind an administrator verification gate.' : 'कीमतें और थोक कैटलॉग केवल स्वीकृत पंजीकृत उपयोगकर्ताओं के लिए दृश्यमान हैं।'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
              <span className="text-xs text-slate-500">
                {lang === 'en' ? 'Secured by Cig-Bid Verification' : 'सिग-बिड सत्यापन सुरक्षा द्वारा सुरक्षित'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-black/50 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} {t.brandTitle} Inc. {lang === 'en' ? 'All rights reserved.' : 'सर्वाधिकार सुरक्षित।'}</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 transition-colors">{lang === 'en' ? 'Terms' : 'नियम'}</span>
            <span className="hover:text-slate-400 transition-colors">{lang === 'en' ? 'Privacy' : 'गोपनीयता'}</span>
            <span className="hover:text-slate-400 transition-colors">{lang === 'en' ? 'GPS Mapping' : 'GPS मैपिंग'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
