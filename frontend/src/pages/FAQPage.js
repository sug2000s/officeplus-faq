import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import api from "../lib/api";
export default function FAQPage() {
    const [faqs, setFaqs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    // Load categories
    useEffect(() => {
        async function loadCategories() {
            try {
                const { data } = await api.get("/faq/categories");
                setCategories(data.categories || []);
            }
            catch (err) {
                console.error("Failed to load categories:", err);
            }
        }
        loadCategories();
    }, []);
    // Load FAQs
    useEffect(() => {
        async function loadFAQs() {
            setLoading(true);
            setError(null);
            try {
                const params = { limit: 50 };
                if (selectedCategory)
                    params.category = selectedCategory;
                if (searchQuery)
                    params.search = searchQuery;
                const { data } = await api.get("/faq/", { params });
                setFaqs(data);
            }
            catch (err) {
                console.error(err);
                setError("FAQ 데이터를 불러오지 못했습니다.");
            }
            finally {
                setLoading(false);
            }
        }
        loadFAQs();
    }, [selectedCategory, searchQuery]);
    const handleToggle = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };
    const handleSearch = (e) => {
        e.preventDefault();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h1", { className: "text-2xl font-semibold text-slate-800", children: "FAQ" }) }), _jsx("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: _jsxs("form", { onSubmit: handleSearch, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "\uAC80\uC0C9" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "\uC9C8\uBB38\uC774\uB098 \uB2F5\uBCC0\uC5D0\uC11C \uAC80\uC0C9...", className: "w-full rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "\uCE74\uD14C\uACE0\uB9AC" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", onClick: () => setSelectedCategory(""), className: `rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === ""
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`, children: "\uC804\uCCB4" }), categories.map((cat) => (_jsxs("button", { type: "button", onClick: () => setSelectedCategory(cat.name), className: `rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.name
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`, children: [cat.name, " (", cat.count, ")"] }, cat.name)))] })] })] }) }), loading ? (_jsx("p", { className: "text-slate-500", children: "\uB85C\uB529 \uC911..." })) : error ? (_jsx("p", { className: "text-red-500", children: error })) : faqs.length === 0 ? (_jsx("div", { className: "rounded-xl bg-white p-6 shadow-sm text-center text-slate-500", children: "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." })) : (_jsx("div", { className: "space-y-3", children: faqs.map((faq) => (_jsxs("div", { className: "rounded-xl bg-white shadow-sm overflow-hidden", children: [_jsx("button", { onClick: () => handleToggle(faq.id), className: "w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800", children: faq.category }), _jsxs("span", { className: "text-xs text-slate-500", children: ["\uC870\uD68C ", faq.view_count, "\uD68C"] })] }), _jsx("h3", { className: "text-base font-semibold text-slate-800", children: faq.question })] }), _jsx("svg", { className: `h-5 w-5 text-slate-400 transition-transform ${expandedId === faq.id ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }) }), expandedId === faq.id && (_jsxs("div", { className: "px-6 py-4 border-t border-slate-100 bg-slate-50", children: [_jsx("div", { className: "prose prose-sm max-w-none", children: _jsx("p", { className: "text-slate-700 whitespace-pre-wrap", children: faq.answer }) }), faq.tags && (_jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: faq.tags.split(",").map((tag, idx) => (_jsxs("span", { className: "inline-block rounded bg-slate-200 px-2 py-1 text-xs text-slate-600", children: ["#", tag.trim()] }, idx))) }))] }))] }, faq.id))) }))] }));
}
