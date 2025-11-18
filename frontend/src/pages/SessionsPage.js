import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { fetchSessions } from "../lib/api";
export default function SessionsPage() {
    const [sessions, setSessions] = useState([]);
    const [limit, setLimit] = useState(25);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchSessions(limit);
                setSessions(data);
            }
            catch (err) {
                console.error(err);
                setError("세션 데이터를 불러오지 못했습니다.");
            }
            finally {
                setLoading(false);
            }
        }
        load();
    }, [limit]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold text-slate-800", children: "Redis \uC138\uC158" }), _jsxs("label", { className: "text-sm text-slate-600", children: ["\uC870\uD68C \uAC74\uC218:", _jsx("select", { value: limit, className: "ml-2 rounded-md border border-slate-300 px-2 py-1", onChange: (e) => setLimit(Number(e.target.value)), children: [10, 25, 50, 100].map((size) => (_jsx("option", { value: size, children: size }, size))) })] })] }), loading ? (_jsx("p", { className: "text-slate-500", children: "\uB85C\uB529 \uC911..." })) : error ? (_jsx("p", { className: "text-red-500", children: error })) : (_jsx("div", { className: "rounded-xl bg-white shadow-sm", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 text-sm", children: [_jsx("thead", { className: "bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2", children: "\uD0A4" }), _jsx("th", { className: "px-4 py-2", children: "TTL(\uCD08)" }), _jsx("th", { className: "px-4 py-2", children: "\uAC12" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100 bg-white", children: sessions.map((session) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 font-mono text-xs text-slate-700", children: session.key }), _jsx("td", { className: "px-4 py-3", children: session.ttl }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: _jsx("pre", { className: "max-h-40 overflow-auto rounded bg-slate-50 p-3 text-xs", children: JSON.stringify(session.value, null, 2) }) })] }, session.key))) })] }) }) }))] }));
}
