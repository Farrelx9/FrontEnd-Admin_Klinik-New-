import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
      <p className="font-display text-6xl font-extrabold text-[var(--color-teal-700)]">404</p>
      <h1 className="mt-3 font-display text-xl font-bold text-[var(--color-ink)]">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-1.5 max-w-sm font-body text-sm text-[var(--color-muted)]">
        URL yang kamu tuju tidak ada atau sudah dipindahkan.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-[var(--color-teal-700)] px-5 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
