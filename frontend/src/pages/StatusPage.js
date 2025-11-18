import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { fetchDatabaseStatus, fetchHealth } from "../lib/api";
export default function StatusPage() {
    const [dbStatus, setDbStatus] = useState(null);
    const [health, setHealth] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function load() {
            try {
                const [healthResp, dbResp] = await Promise.all([
                    fetchHealth(),
                    fetchDatabaseStatus(),
                ]);
                setHealth(healthResp);
                setDbStatus(dbResp);
            }
            catch (err) {
                console.error(err);
                setError("상태 정보를 불러오지 못했습니다.");
            }
        }
        load();
    }, []);
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-slate-800", children: "\uC2DC\uC2A4\uD15C \uC0C1\uD0DC" }), error && _jsx("p", { className: "text-red-500", children: error }), _jsxs("section", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "FastAPI" }), health ? (_jsxs("dl", { className: "mt-4 space-y-2 text-sm text-slate-600", children: [_jsxs("div", { children: [_jsx("dt", { className: "font-medium text-slate-800", children: "\uC0C1\uD0DC" }), _jsx("dd", { children: health.status })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-medium text-slate-800", children: "\uD658\uACBD" }), _jsx("dd", { children: health.environment })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-medium text-slate-800", children: "\uC5C5\uB370\uC774\uD2B8" }), _jsx("dd", { children: health.timestamp })] })] })) : (_jsx("p", { className: "text-slate-500", children: "\uD5EC\uC2A4 \uCCB4\uD06C \uC815\uBCF4\uB97C \uAC00\uC838\uC624\uB294 \uC911..." }))] }), _jsxs("section", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "Postgres" }), dbStatus ? (_jsxs("dl", { className: "mt-4 space-y-2 text-sm text-slate-600", children: [_jsxs("div", { children: [_jsx("dt", { className: "font-medium text-slate-800", children: "\uB370\uC774\uD130\uBCA0\uC774\uC2A4" }), _jsx("dd", { children: dbStatus.database })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-medium text-slate-800", children: "\uC11C\uBC84 \uC2DC\uAC04" }), _jsx("dd", { children: dbStatus.current_time })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-medium text-slate-800", children: "DSN" }), _jsx("dd", { children: dbStatus.dsn })] })] })) : (_jsx("p", { className: "text-slate-500", children: "DB \uC0C1\uD0DC \uC815\uBCF4\uB97C \uAC00\uC838\uC624\uB294 \uC911..." }))] })] }));
}
