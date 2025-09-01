// src/app/login/page.tsx  (wire to backend via /api/auth/login, visible inputs, lifted button)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import { useI18n } from '@/components/i18n/I18nProvider';

type Lang = 'en' | 'am';

const copy: Record<Lang, any> = {
  en: {
    title: 'Welcome back',
    subtitle: 'Sign in to  SHEGA dashboard.',
    email: 'Email',
    password: 'Password',
    show: 'Show',
    hide: 'Hide',
    submit: 'Login',
    backHome: 'Back to Home',
    forgot: 'Forgot password?',
    error: 'Invalid email or password',
  },
  am: {
    title: 'እንኳን በደህና መጡ',
    subtitle: 'ወደ SHEGA ዳሽቦርድዎ ይግቡ።',
    email: 'ኢሜይል',
    password: 'የይለፍ ቃል',
    show: 'አሳይ',
    hide: 'አስውር',
    submit: 'መግባት',
    backHome: 'ወደ መነሻ ገጽ',
    forgot: 'የይለፍ ቃልን ረሱ?',
    error: 'የተሳሳተ ኢሜይል ወይም የይለፍ ቃል',
  },
};

export default function LoginPage() {
  const { lang } = useI18n();
  const t = copy[lang as Lang];

  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const btnLift =
    'rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 active:shadow';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
      });
      console.log('Login response:', res.status, res.statusText);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || t.error);
      }
     const result = await res.json();
      const user = result.user; // This is  user data
      console.log('Logged in user:', user);
      if(user.role === 'admin'){
      
     window.location.href = '/admindash';

      } else {
      
        window.location.href = ('/dashboard');
      
      }
    
    } catch (e: any) {
      // console.error('Login error:', e);
      setErr(e?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-[70vh] place-items-center px-4">
      {/* soft blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-blue-400/25 to-purple-400/25 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-300/25 to-amber-300/25 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* brand chip */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 shadow-sm">
          <Shield size={14} /> SHEGA
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur">
          <h1 className="mb-1 text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="mb-6 text-sm text-slate-600">{t.subtitle}</p>

          {err && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-800">{t.email}</span>
              <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                <Mail size={18} className="text-slate-500" />
                <input
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                />
              </div>
            </label>

            {/* Password */}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-800">{t.password}</span>
              <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                <Lock size={18} className="text-slate-500" />
                <input
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="********"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  type={showPwd ? 'text' : 'password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="rounded-lg px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  aria-label={showPwd ? 'Hide' : 'Show'}
                  title={showPwd ? 'Hide' : 'Show'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* Submit */}
            <button
              className={`${btnLift} w-full h-12 text-base font-semibold flex items-center justify-center gap-2`}
              type="submit"
              disabled={loading}
            >
              <LogIn size={18} />
              {loading ? (lang === 'am' ? 'በመግባት ላይ…' : 'Signing in…') : t.submit}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/" className="rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100">
              ← {t.backHome}
            </Link>
            {t.forgot && (
              <a href="#" className="rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100">
                {t.forgot}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
