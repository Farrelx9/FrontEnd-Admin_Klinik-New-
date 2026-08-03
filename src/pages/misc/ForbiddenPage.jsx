import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-coral-soft)] text-[var(--color-coral)]">
        <ShieldAlert size={26} />
      </span>
      <h1 className="mt-4 font-display text-xl font-bold text-[var(--color-ink)]">
        Akses ditolak
      </h1>
      <p className="mt-1.5 max-w-sm font-body text-sm text-[var(--color-muted)]">
        Akun kamu tidak memiliki izin untuk membuka halaman ini.
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
