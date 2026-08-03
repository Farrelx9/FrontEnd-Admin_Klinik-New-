import { useState } from "react";
import { Menu, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/50 lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-[17px] font-bold text-[var(--color-ink)]">
          {title}
        </h1>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-[var(--color-mint-200)]/50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-teal-700)] text-white">
            <User size={16} />
          </span>
          <span className="hidden font-body text-sm font-medium text-[var(--color-ink)] sm:block">
            {user?.name || "Pengguna"}
          </span>
          <ChevronDown size={15} className="text-[var(--color-muted)]" />
        </button>

        {menuOpen && (
          <>
            {/* Click-away overlay */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg animate-fade-in-up">
              <div className="border-b border-[var(--color-border)] px-4 py-3">
                <p className="font-body text-sm font-semibold text-[var(--color-ink)]">
                  {user?.name || "Pengguna"}
                </p>
                <p className="font-body text-xs text-[var(--color-muted)]">
                  {user?.email || user?.role || ""}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-2.5 font-body text-sm text-[var(--color-coral)] hover:bg-[var(--color-coral-soft)]"
              >
                <LogOut size={15} />
                Keluar
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
