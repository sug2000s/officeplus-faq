import { useEffect, useState } from "react";
import { fetchDatabaseStatus, fetchHealth } from "../lib/api";

export default function StatusPage() {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [healthResp, dbResp] = await Promise.all([
          fetchHealth(),
          fetchDatabaseStatus(),
        ]);
        setHealth(healthResp);
        setDbStatus(dbResp);
      } catch (err) {
        console.error(err);
        setError("상태 정보를 불러오지 못했습니다.");
      }
    }

    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">시스템 상태</h1>

      {error && <p className="text-red-500">{error}</p>}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">FastAPI</h2>
        {health ? (
          <dl className="mt-4 space-y-2 text-sm text-slate-600">
            <div>
              <dt className="font-medium text-slate-800">상태</dt>
              <dd>{health.status}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">환경</dt>
              <dd>{health.environment}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">업데이트</dt>
              <dd>{health.timestamp}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-slate-500">헬스 체크 정보를 가져오는 중...</p>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Postgres</h2>
        {dbStatus ? (
          <dl className="mt-4 space-y-2 text-sm text-slate-600">
            <div>
              <dt className="font-medium text-slate-800">데이터베이스</dt>
              <dd>{dbStatus.database}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">서버 시간</dt>
              <dd>{dbStatus.current_time}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">DSN</dt>
              <dd>{dbStatus.dsn}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-slate-500">DB 상태 정보를 가져오는 중...</p>
        )}
      </section>
    </div>
  );
}
