import { useEffect, useState } from 'react';
import { Building2, Trash2, Download } from 'lucide-react';
import { formatDateTime } from '../utils/formatDate';

interface EnterpriseInquiry {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  participants: string;
  cooperationTypes: string[];
  topicNeeds: string;
  preferredTiming: string;
  otherNotes: string;
  createdAt: string;
}

interface EnterpriseInquiriesManagerProps {
  onToast: (text: string, type?: 'success' | 'error') => void;
  onUnauthorized: () => void;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function EnterpriseInquiriesManager({ onToast, onUnauthorized }: EnterpriseInquiriesManagerProps) {
  const [inquiries, setInquiries] = useState<EnterpriseInquiry[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/admin/enterprise-inquiries');
      if (res.status === 401) return onUnauthorized();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error || '讀取企業洽詢名單失敗');
        setInquiries([]);
        return;
      }
      setLoadError('');
      setInquiries(data);
    } catch {
      setLoadError('讀取企業洽詢名單時發生網路錯誤');
      setInquiries([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (inquiry: EnterpriseInquiry) => {
    if (!window.confirm(`確定要刪除「${inquiry.companyName}」的洽詢紀錄嗎？此操作無法復原。`)) return;
    try {
      const res = await fetch(`/api/admin/enterprise-inquiries/${inquiry.id}`, { method: 'DELETE' });
      if (res.status === 401) return onUnauthorized();
      if (res.ok) {
        onToast('已刪除');
        setInquiries((prev) => prev?.filter((i) => i.id !== inquiry.id) ?? prev);
      } else {
        const data = await res.json().catch(() => ({}));
        onToast(data.error || '刪除失敗', 'error');
      }
    } catch {
      onToast('刪除時發生網路錯誤', 'error');
    }
  };

  const handleExport = () => {
    if (!inquiries || inquiries.length === 0) return;
    const rows = [
      ['公司名稱', '聯絡人', 'Email', '電話', '預估參與人數', '合作方式', '需求說明', '希望合作時間', '其他備註', '送出時間'],
      ...inquiries.map((i) => [
        i.companyName,
        i.contactName,
        i.email,
        i.phone,
        i.participants,
        i.cooperationTypes.join('、'),
        i.topicNeeds,
        i.preferredTiming,
        i.otherNotes,
        formatDateTime(i.createdAt),
      ]),
    ];
    // ﻿: so Excel opens the file as UTF-8 instead of garbling the Chinese text.
    const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `企業洽詢名單_${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">企業洽詢名單</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            企業永續合作頁面表單送出的洽詢紀錄
            {inquiries && inquiries.length > 0 && <span className="ml-2 font-bold text-slate-700">共 {inquiries.length} 筆</span>}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={!inquiries || inquiries.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <Download className="w-4 h-4" /> 匯出 CSV
        </button>
      </div>

      {loadError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-bold">{loadError}</div>
      )}

      {inquiries === null ? (
        <div className="py-16 text-center text-sm text-slate-400">載入中...</div>
      ) : inquiries.length === 0 && !loadError ? (
        <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
          <Building2 className="w-10 h-10 text-slate-300" />
          還沒有企業洽詢紀錄
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-900">{inquiry.companyName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(inquiry.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleDelete(inquiry)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                  title="刪除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <p><span className="text-slate-400">聯絡人：</span><span className="text-slate-800">{inquiry.contactName}</span></p>
                <p><span className="text-slate-400">Email：</span><span className="text-slate-800 break-all">{inquiry.email}</span></p>
                <p><span className="text-slate-400">電話：</span><span className="text-slate-800">{inquiry.phone}</span></p>
                <p><span className="text-slate-400">預估參與人數：</span><span className="text-slate-800">{inquiry.participants || '—'}</span></p>
                <p><span className="text-slate-400">希望合作時間：</span><span className="text-slate-800">{inquiry.preferredTiming || '—'}</span></p>
                <p className="sm:col-span-2"><span className="text-slate-400">合作方式：</span><span className="text-slate-800">{inquiry.cooperationTypes.join('、') || '—'}</span></p>
                {inquiry.topicNeeds && (
                  <p className="sm:col-span-2"><span className="text-slate-400">需求說明：</span><span className="text-slate-800 whitespace-pre-line">{inquiry.topicNeeds}</span></p>
                )}
                {inquiry.otherNotes && (
                  <p className="sm:col-span-2"><span className="text-slate-400">其他備註：</span><span className="text-slate-800 whitespace-pre-line">{inquiry.otherNotes}</span></p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
