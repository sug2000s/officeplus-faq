import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { fetchHealth, fetchWhoAmI } from "../lib/api";
export default function HomePage() {
    const [health, setHealth] = useState();
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function load() {
            try {
                const [healthResp, whoamiResp] = await Promise.all([
                    fetchHealth(),
                    fetchWhoAmI(),
                ]);
                setHealth(healthResp);
                setUserInfo(whoamiResp.user_info);
            }
            catch (err) {
                console.error(err);
                setError("헬스 체크 또는 세션 정보를 불러오지 못했습니다.");
            }
            finally {
                setLoading(false);
            }
        }
        load();
    }, []);
    if (loading) {
        return _jsx("div", { className: "text-slate-600", children: "\uBD88\uB7EC\uC624\uB294 \uC911..." });
    }
    if (error) {
        return _jsx("div", { className: "text-red-500", children: error });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "\uC2DC\uC2A4\uD15C \uC0C1\uD0DC" }), _jsxs("p", { className: "text-sm text-slate-500", children: [health?.status ?? "unknown", " | ", health?.timestamp] })] }), _jsxs("section", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800", children: "\uC138\uC158 \uC815\uBCF4" }), userInfo ? (_jsxs("dl", { className: "mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600", children: [_jsxs("div", { children: [_jsx("dt", { className: "font-medium text-slate-800", children: "\uC0AC\uBC88" }), _jsx("dd", { children: userInfo.id ?? userInfo.emp_no })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-medium text-slate-800", children: "\uC774\uB984" }), _jsx("dd", { children: userInfo.name ?? userInfo.emp_nm })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-medium text-slate-800", children: "\uBD80\uC11C" }), _jsx("dd", { children: userInfo.dept })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-medium text-slate-800", children: "\uBC95\uC778" }), _jsx("dd", { children: userInfo.corp })] })] })) : (_jsx("p", { className: "text-slate-500", children: "\uC138\uC158 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." }))] })] }));
}
