import { useEffect, useState } from "react";
import { fetchSessions, type SessionSummary } from "../lib/api";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSessions(limit);
        setSessions(data);
      } catch (err) {
        console.error(err);
        setError("세션 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [limit]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Redis 세션</h1>
        <label className="text-sm text-slate-600">
          조회 건수:
          <select
            value={limit}
            className="ml-2 rounded-md border border-slate-300 px-2 py-1"
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-slate-500">로딩 중...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">키</th>
                  <th className="px-4 py-2">TTL(초)</th>
                  <th className="px-4 py-2">값</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sessions.map((session) => (
                  <tr key={session.key}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {session.key}
                    </td>
                    <td className="px-4 py-3">{session.ttl}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <pre className="max-h-40 overflow-auto rounded bg-slate-50 p-3 text-xs">
                        {JSON.stringify(session.value, null, 2)}
                      </pre>
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
