import { FormEvent, useState } from 'react';
import Seo from '../components/Seo';
import { useSiteContent } from '../hooks/useSiteContent';
import { Award, HeartHandshake, Sparkles, CheckCircle2 } from 'lucide-react';

const SERVICE_ICONS = [Sparkles, Award, HeartHandshake] as const;

interface FormState {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  participants: string;
  cooperationTypes: string[];
  topicNeeds: string;
  preferredTiming: string;
  otherNotes: string;
  website: string; // honeypot
}

const EMPTY_FORM: FormState = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  participants: '',
  cooperationTypes: [],
  topicNeeds: '',
  preferredTiming: '',
  otherNotes: '',
  website: '',
};

export default function Enterprise() {
  const { content } = useSiteContent();
  const page = content.enterprisePage;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const toggleType = (title: string) => {
    setForm((prev) => ({
      ...prev,
      cooperationTypes: prev.cooperationTypes.includes(title)
        ? prev.cooperationTypes.filter((t) => t !== title)
        : [...prev.cooperationTypes, title],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const res = await fetch('/api/enterprise-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setError(data.error || '送出失敗，請稍後再試');
        return;
      }
      setStatus('success');
      setForm(EMPTY_FORM);
    } catch {
      setStatus('error');
      setError('送出時發生網路錯誤，請稍後再試');
    }
  };

  return (
    <div className="space-y-16 pb-20">
      <Seo
        title="企業永續合作"
        description="星育學苑為企業提供員工財務素養講座、系列課程與客製化金融素養內容，協助企業推動員工財務健康與永續人才發展。"
      />

      {/* Hero */}
      <div className="bg-linear-to-b from-slate-900 to-slate-800 pt-16 pb-14 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight whitespace-pre-line">{page.heroTitle}</h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed whitespace-pre-line max-w-2xl mx-auto">{page.heroSubtitle}</p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-all active:scale-95"
          >
            {page.heroCtaText}
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 服務項目（固定 3 項） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {page.services.map((service, idx) => {
            const Icon = SERVICE_ICONS[idx] || Sparkles;
            return (
              <div key={idx} className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{service.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{service.description}</p>
              </div>
            );
          })}
        </div>

        {/* 為什麼是星育 */}
        <div className="space-y-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center">{page.whyUsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {page.whyUs.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 學習成果 */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 sm:p-10 space-y-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">{page.outcomesTitle}</h2>
          <p className="text-slate-600">{page.outcomesBody}</p>
          <div className="flex flex-wrap gap-3">
            {page.outcomesList.map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" /> {item}
              </span>
            ))}
          </div>
        </div>

        {/* ESG／員工福祉 */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{page.esgTitle}</h2>
          <p className="text-slate-600 leading-loose">{page.esgBody}</p>
        </div>

        {/* 洽詢表單 */}
        <div id="contact" className="scroll-mt-24 max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">{page.esgCtaText}</h2>
            <p className="text-sm text-slate-500">留下您的資訊，我們將盡快與您聯繫</p>
          </div>

          {status === 'success' ? (
            <div className="py-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="font-bold text-slate-900">已收到您的洽詢，我們會盡快與您聯繫！</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot */}
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">公司名稱 *</label>
                  <input
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">聯絡人姓名 *</label>
                  <input
                    required
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">聯絡電話 *</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">預估參與人數</label>
                  <input
                    value={form.participants}
                    onChange={(e) => setForm({ ...form, participants: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">希望合作時間</label>
                  <input
                    value={form.preferredTiming}
                    onChange={(e) => setForm({ ...form, preferredTiming: e.target.value })}
                    placeholder="例如：2026 年第一季"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">希望合作方式（可複選）</label>
                <div className="flex flex-wrap gap-3">
                  {page.services.map((service, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => toggleType(service.title)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                        form.cooperationTypes.includes(service.title)
                          ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {service.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">需求說明</label>
                <textarea
                  value={form.topicNeeds}
                  onChange={(e) => setForm({ ...form, topicNeeds: e.target.value })}
                  rows={3}
                  placeholder="想了解的主題、期望達成的目標等"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">其他備註</label>
                <textarea
                  value={form.otherNotes}
                  onChange={(e) => setForm({ ...form, otherNotes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 resize-none"
                />
              </div>

              {status === 'error' && (
                <p className="text-sm font-bold text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {status === 'submitting' ? '送出中...' : '送出洽詢'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
