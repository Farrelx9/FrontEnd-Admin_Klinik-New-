import PageHeader from "./PageHeader";

/**
 * Quick scaffold for a nav destination that hasn't been designed yet.
 * Swap this out per-page as you slice the real UI — routing already
 * points here so nothing else needs to change when you do.
 */
export default function PlaceholderPage({ title, description, icon: Icon }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 text-center">
        {Icon && (
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-mint-200)] text-[var(--color-teal-700)]">
            <Icon size={22} />
          </span>
        )}
        <p className="font-display text-[15px] font-semibold text-[var(--color-ink)]">
          Halaman ini belum di-slice
        </p>
        <p className="mt-1 max-w-xs font-body text-sm text-[var(--color-muted)]">
          Routing dan proteksi akses sudah siap — tinggal isi UI-nya.
        </p>
      </div>
    </div>
  );
}
