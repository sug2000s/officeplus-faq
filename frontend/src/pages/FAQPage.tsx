import { useEffect, useState } from "react";
import api from "../lib/api";

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  tags: string | null;
  view_count: number;
  created_at: string;
}

interface Category {
  name: string;
  count: number;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data } = await api.get("/faq/categories");
        setCategories(data.categories || []);
      } catch (err) {
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
        const params: any = { limit: 50 };
        if (selectedCategory) params.category = selectedCategory;
        if (searchQuery) params.search = searchQuery;

        const { data } = await api.get("/faq/", { params });
        setFaqs(data);
      } catch (err) {
        console.error(err);
        setError("FAQ 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadFAQs();
  }, [selectedCategory, searchQuery]);

  const handleToggle = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">FAQ</h1>
      </div>

      {/* Search and Filter */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              검색
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="질문이나 답변에서 검색..."
              className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              카테고리
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === ""
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                전체
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === cat.name
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* FAQ List */}
      {loading ? (
        <p className="text-slate-500">로딩 중...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : faqs.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm text-center text-slate-500">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-xl bg-white shadow-sm overflow-hidden"
            >
              <button
                onClick={() => handleToggle(faq.id)}
                className="w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {faq.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        조회 {faq.view_count}회
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">
                      {faq.question}
                    </h3>
                  </div>
                  <svg
                    className={`h-5 w-5 text-slate-400 transition-transform ${
                      expandedId === faq.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {expandedId === faq.id && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                  </div>
                  {faq.tags && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {faq.tags.split(",").map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block rounded bg-slate-200 px-2 py-1 text-xs text-slate-600"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}