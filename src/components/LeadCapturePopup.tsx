import { useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { X, CheckCircle2, Mail } from 'lucide-react';
import { useSiteContent } from '../hooks/useSiteContent';
import BrandLogo from './BrandLogo';

const SUBMITTED_KEY = 'staredu_lead_submitted';
const DISMISSED_UNTIL_KEY = 'staredu_lead_dismissed_until';
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 900;

function readFlag(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private browsing etc. — just show every visit rather than crash
  }
}

function writeFlag(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/** Site-wide "leave your email" popup — one instance, mounted once in App. */
export default function LeadCapturePopup() {
  const { content, loaded } = useSiteContent();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loaded || !content.leadCapture.enabled) return;
    if (location.pathname.startsWith('/admin')) return;
    if (readFlag(SUBMITTED_KEY)) return;
    const until = Number(readFlag(DISMISSED_UNTIL_KEY) || 0);
    if (until && Date.now() < until) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
    // Only decide once per app load — not on every route change within the SPA.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, content.leadCapture.enabled]);

  const dismiss = () => {
    setVisible(false);
    writeFlag(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('請輸入正確的 Email 格式');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: location.pathname, website }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '送出失敗，請稍後再試');
        setStatus('error');
        return;
      }
      writeFlag(SUBMITTED_KEY, '1');
      setStatus('done');
    } catch {
      setError('送出時發生網路錯誤，請稍後再試');
      setStatus('error');
    }
  };

  if (!visible) return null;
  const lc = content.leadCapture;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-7 sm:p-8 space-y-5"
      >
        <button
          onClick={dismiss}
          aria-label="關閉"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {status === 'done' ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">{lc.successTitle}</h3>
            <p className="text-sm text-slate-500">{lc.successMessage}</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <BrandLogo iconSize={44} textColor="text-slate-900" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-black text-slate-900">{lc.title}</h3>
              {lc.subtitle && <p className="text-sm text-slate-500">{lc.subtitle}</p>}
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lc.placeholder}
                  autoFocus
                  required
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              {/* Honeypot: hidden from real visitors, invisible to screen readers, but bots that
                  fill every field trip it. */}
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute opacity-0 pointer-events-none -z-10 w-px h-px"
              />
              {error && <p className="text-xs font-bold text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20"
              >
                {status === 'sending' ? '送出中...' : lc.buttonText}
              </button>
              {lc.disclaimer && <p className="text-[11px] text-center text-slate-400 leading-relaxed">{lc.disclaimer}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
