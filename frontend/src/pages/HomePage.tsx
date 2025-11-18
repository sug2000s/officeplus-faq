import { useEffect, useState } from "react";
import { fetchHealth, fetchWhoAmI } from "../lib/api";

export default function HomePage() {
  const [health, setHealth] = useState<{ status: string; timestamp: string }>();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [healthResp, whoamiResp] = await Promise.all([
          fetchHealth(),
          fetchWhoAmI(),
        ]);
        setHealth(healthResp);
        setUserInfo(whoamiResp.user_info);
      } catch (err) {
        console.error(err);
        setError("헬스 체크 또는 세션 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="text-slate-600">불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">시스템 상태</h2>
        <p className="text-sm text-slate-500">
          {health?.status ?? "unknown"} | {health?.timestamp}
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">세션 정보</h2>
        {userInfo ? (
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <dt className="font-medium text-slate-800">사번</dt>
              <dd>{userInfo.id ?? userInfo.emp_no}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">이름</dt>
              <dd>{userInfo.name ?? userInfo.emp_nm}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">부서</dt>
              <dd>{userInfo.dept}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">법인</dt>
              <dd>{userInfo.corp}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-slate-500">세션 정보가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
