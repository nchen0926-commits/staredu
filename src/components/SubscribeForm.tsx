import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';

/** "Leave your email" form shown inside an article (where the editor's 訂閱表單 block is placed). */
export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
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
        setStatus('idle');
        return;
      }
      setStatus('done');
    } catch {
      setError('送出時發生網路錯誤，請稍後再試');
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return <p className="font-bold text-emerald-700 mt-3">謝謝你！之後有新文章，會寄到你的信箱。</p>;
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2 justify-center relative">
      <div className="relative flex-1 max-w-sm sm:min-w-[15rem]">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="你的 Email"
          required
          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
        />
      </div>
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none -z-10 w-px h-px"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-base transition-colors"
      >
        {status === 'sending' ? '送出中…' : '訂閱電子報'}
      </button>
      {error && <p className="basis-full text-sm font-bold text-red-600">{error}</p>}
    </form>
  );
}
