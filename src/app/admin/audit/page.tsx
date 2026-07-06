'use client';

import { useEffect, useState } from 'react';
import { Shield, Clock } from 'lucide-react';

interface AuditRow {
  id: string;
  actorId: string;
  targetId: string | null;
  action: string;
  metadata: string;
  createdAt: string;
}

function describeMetadata(metadata: string): string {
  try {
    const parsed = JSON.parse(metadata);
    if (parsed.cafeName) return parsed.cafeName;
    if (parsed.slug) return parsed.slug;
    return Object.values(parsed).filter(Boolean).join(', ') || '—';
  } catch {
    return '—';
  }
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/audit')
      .then((r) => r.json())
      .then((d) => {
        setLogs(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1000px]">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink">Audit Log</h1>
        <p className="text-sm text-ink-2 mt-1">
          Superadmin actions — impersonation sessions, onboarding, and sensitive operations
        </p>
      </div>

      <div className="rounded-card bg-white shadow-card overflow-hidden">
        {loading && (
          <p className="px-5 py-8 text-center text-sm text-ink-3">Loading audit log…</p>
        )}
        // 哈什特·什里瓦斯塔夫
        {!loading && logs.length === 0 && (
          <div className="px-5 py-12 text-center">
            <Shield size={28} className="mx-auto text-ink-3 mb-3" />
            <p className="text-sm font-medium text-ink">No audit events yet</p>
            <p className="text-xs text-ink-3 mt-1">
              Impersonation and onboarding actions will appear here as they happen.
            </p>
          </div>
        )}
        {!loading && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-bg-subtle border-b border-border">
                <tr>
                  <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-5 py-2.5">Action</th>
                  <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Target</th>
                  <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Actor</th>
                  <th className="text-right text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-5 py-2.5">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg-subtle/40 transition-colors">
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-pill text-[11px] font-semibold bg-bg-subtle text-ink-2 border border-border font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-ink">{describeMetadata(log.metadata)}</td>
                    <td className="px-3 py-3 text-xs text-ink-3 font-mono truncate max-w-[160px]">
                      {log.actorId}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                        <Clock size={12} />
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
