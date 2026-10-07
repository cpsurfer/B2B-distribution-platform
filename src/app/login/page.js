'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Award, Lock, LogIn, FileText, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { translations } from '@/lib/translations';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('login');
  
  // Login State
  const [loginUsername, setLoginUsername] = useState(''); // phone or email
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Status/Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load language preference
    const saved = localStorage.getItem('cig-bid-lang');
    if (saved) setLang(saved);

    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setActiveTab('register');
    }
  }, [searchParams]);

  const t = translations[lang] || translations.en;

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    localStorage.setItem('cig-bid-lang', nextLang);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.invalidCredentials);
      }

      setSuccess(t.loginSuccess);
      
      setTimeout(() => {
        router.push('/shop');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!regPhone || !regPassword || !businessName) {
      setError(t.allFieldsRequired);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: regPhone,
          password: regPassword,
          businessName,
          email: regEmail,
          taxId,
          licenseNumber,
          address: {
            street,
            city,
            state,
            zipCode,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(data.message || 'Application submitted successfully!');
      
      if (data.isApproved) {
        setTimeout(() => {
          setActiveTab('login');
          setLoginUsername(regPhone);
        }, 3000);
      } else {
        // Clear inputs
        setRegEmail('');
        setRegPassword('');
        setBusinessName('');
        setRegPhone('');
        setTaxId('');
        setLicenseNumber('');
        setStreet('');
        setCity('');
        setState('');
        setZipCode('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-[#0c0c0e] via-[#121216] to-[#08080a] text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-amber-500/30 selection:text-amber-200 min-h-screen">
      
      {/* Language Switch Button */}
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 text-xs bg-slate-800/80 hover:bg-slate-700 text-amber-400 font-bold px-3 py-2 rounded-lg border border-slate-700 hover:border-amber-500/30 transition-all flex items-center gap-1.5"
      >
        <Globe className="w-3.5 h-3.5" />
        {lang === 'en' ? 'हिन्दी' : 'English'}
      </button>

      {/* Brand logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-2 rounded-lg group-hover:scale-105 transition-transform">
          <Award className="w-5 h-5 text-black" />
        </div>
        <span className="text-xl font-black tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
          {t.brandTitle}
        </span>
      </Link>

      <div className="max-w-md w-full bg-gradient-to-b from-[#181820]/90 to-[#101014]/90 border border-slate-800/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-800 pb-4 mb-6">
          <button
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 text-center font-bold text-sm pb-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'text-amber-400 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
            }`}
          >
            <LogIn className="w-4 h-4" /> {t.signIn}
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 text-center font-bold text-sm pb-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'text-amber-400 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
            }`}
          >
            <FileText className="w-4 h-4" /> {t.applyAccess}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                {t.phone} / {lang === 'en' ? 'Email' : 'ईमेल'}
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
                placeholder={lang === 'en' ? "Phone number or email" : "फ़ोन नंबर या ईमेल"}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                {t.password}
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-2.5 rounded-lg shadow-lg hover:shadow-amber-500/10 transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? t.authenticating : t.signIn}
            </button>

            <div className="text-center mt-4">
              <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> {t.secureSSL}
              </span>
            </div>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              {lang === 'en' 
                ? 'Fill details to register. Tax credentials are optional for small shops.' 
                : 'पंजीकरण करने के लिए विवरण भरें। छोटी दुकानों के लिए टैक्स क्रेडेंशियल वैकल्पिक हैं।'}
            </p>

            {/* Shop Name */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                {t.shopName} <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
                placeholder={lang === 'en' ? "E.g. Lucky General Store" : "जैसे- लकी जनरल स्टोर"}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                {t.phone} <span className="text-amber-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
                placeholder="E.g. 9876543210"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                {t.password} <span className="text-amber-500">*</span>
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Optional Email */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                {t.email}
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
                placeholder="optional@store.com"
              />
            </div>

            {/* Optional Wholesaler IDs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  {t.taxId}
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
                  placeholder="GSTIN12345"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  {t.licenseNumber}
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
                  placeholder="LIC-TOB-999"
                />
              </div>
            </div>

            {/* Warehouse Address */}
            <div className="border-t border-slate-800/80 pt-4 mt-2">
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                {t.street} <span className="text-amber-500">*</span>
              </span>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
                placeholder={lang === 'en' ? "Shop No., building, bazaar location" : "दुकान नंबर, बिल्डिंग, बाजार स्थान"}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  {t.city} <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-black/40 border border-slate-800 rounded-lg px-2 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/60 transition-all"
                  placeholder="Mumbai"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  {t.state} <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-black/40 border border-slate-800 rounded-lg px-2 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/60 transition-all"
                  placeholder="MH"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  {t.zipCode} <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full bg-black/40 border border-slate-800 rounded-lg px-2 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/60 transition-all"
                  placeholder="400001"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-2.5 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? t.submitting : t.submitApplication}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-[#0c0c0e] text-slate-100 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Loading Login Portal...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
