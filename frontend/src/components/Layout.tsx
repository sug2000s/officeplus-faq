import { NavLink } from "react-router-dom";
import type { PropsWithChildren } from "react";

const navLinkClass =
  "px-4 py-2 rounded-md text-sm font-medium transition hover:bg-slate-200";

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold text-slate-800">
            OfficePlus FAQ
          </div>
          <nav className="flex gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? "bg-slate-900 text-white" : ""}`
              }
            >
              대시보드
            </NavLink>
            <NavLink
              to="/faq"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? "bg-slate-900 text-white" : ""}`
              }
            >
              FAQ
            </NavLink>
            <NavLink
              to="/sessions"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? "bg-slate-900 text-white" : ""}`
              }
            >
              Redis 세션
            </NavLink>
            <NavLink
              to="/status"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? "bg-slate-900 text-white" : ""}`
              }
            >
              시스템 상태
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
