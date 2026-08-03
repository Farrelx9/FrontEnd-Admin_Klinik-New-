import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LogoMark from "../../components/Logo";

export default function LoginPage() {
  const { login, loginPending, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form);
    if (result.success) {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden on small screens to keep the form front and center */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--color-teal-700)] p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, var(--color-mint-400), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--color-mint-400), transparent 70%)" }}
        />

        <div className="relative flex items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <span className="font-display text-lg font-bold">Klinik Senyum</span>
        </div>

        <div className="relative max-w-sm">
          <p className="font-display text-3xl font-bold leading-tight">
            Satu tempat untuk seluruh operasional klinik.
          </p>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-white/75">
            Kelola jadwal kunjungan, rekam medis pasien, dan pembayaran
            dalam satu panel admin.
          </p>
        </div>

        <p className="relative font-body text-xs text-white/50">
          © {new Date().getFullYear()} Klinik Senyum. Internal use only.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[var(--color-bg)] px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoMark />
            <span className="font-display text-base font-bold text-[var(--color-ink)]">
              Klinik Senyum
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">
            Masuk ke panel admin
          </h2>
          <p className="mt-1.5 font-body text-sm text-[var(--color-muted)]">
            Gunakan akun staf yang terdaftar di klinik.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block font-body text-[13px] font-medium text-[var(--color-ink)]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="staf@klinikgigi.com"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 font-body text-sm text-[var(--color-ink)] outline-none transition-shadow placeholder:text-[var(--color-muted)]/70 focus:ring-2 focus:ring-[var(--color-teal-500)]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block font-body text-[13px] font-medium text-[var(--color-ink)]"
              >
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 pr-10 font-body text-sm text-[var(--color-ink)] outline-none transition-shadow placeholder:text-[var(--color-muted)]/70 focus:ring-2 focus:ring-[var(--color-teal-500)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-[var(--color-coral-soft)] px-3.5 py-2.5 font-body text-[13px] text-[var(--color-coral)]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loginPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginPending ? (
                "Memproses…"
              ) : (
                <>
                  <LogIn size={16} />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
