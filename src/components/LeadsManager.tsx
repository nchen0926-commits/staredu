import { useEffect, useState } from 'react';
import { Mail, Trash2, Download } from 'lucide-react';
import { formatDateTime } from '../utils/formatDate';

interface Lead {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

interface LeadsManagerProps {
  onToast: (text: string, type?: 'success' | 'error') => void;
  onUnauthorized: () => void;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function LeadsManager({ onToast, onUnauthorized }: LeadsManagerProps) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/admin/leads');
      if (res.status === 401) return onUnauthorized();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error || '讀取名單失敗');
        setLeads([]);
        return;
      }
      setLoadError('');
      setLeads(data);
    } catch {
      setLoadError('讀取名單時發生網路錯誤');
      setLeads([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (lead: Lead) => {
    if (!window.confirm(`確定要刪除「${lead.email}」嗎？此操作無法復原。`)) return;
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { method: 'DELETE' });
      if (res.status === 401) return onUnauthorized();
      if (res.ok) {
        onToast('已刪除');
        setLeads((prev) => prev?.filter((l) => l.id !== lead.id) ?? prev);
      } else {
        const data = await res.json().catch(() => ({}));
        onToast(data.error || '刪除失敗', 'error');
      }
    } catch {
      onToast('刪除時發生網路錯誤', 'error');
    }
  };

  const handleExport = () => {
    if (!leads || leads.length === 0) return;
    const rows = [
      ['Email', '收集時間', '來源頁面'],
      ...leads.map((l) => [l.email, formatDateTime(l.createdAt), l.source || '']),
    ];
    // ﻿: so Excel opens the file as UTF-8 instead of garbling the Chinese text.
    const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `訂閱名單_${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">訂閱名單</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            訪客在彈窗留下的 Email
            {leads && leads.length > 0 && <span className="ml-2 font-bold text-slate-700">共 {leads.length} 筆</span>}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={!leads || leads.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <Download className="w-4 h-4" /> 匯出 CSV
        </button>
      </div>

      {loadError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-bold">{loadError}</div>
      )}

      {leads === null ? (
        <div className="py-16 text-center text-sm text-slate-400">載入中...</div>
      ) : leads.length === 0 && !loadError ? (
        <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
          <Mail className="w-10 h-10 text-slate-300" />
          還沒有人留下 Email
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-500">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">收集時間</th>
                  <th className="px-5 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-bold text-slate-800 break-all">{lead.email}</td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(lead.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(lead)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
