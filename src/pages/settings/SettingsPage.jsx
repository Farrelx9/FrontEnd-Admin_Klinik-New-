import { useState } from "react";
import { User, Lock, Shield, Stethoscope, LogOut, Save } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { updateProfileRequest } from "../../services/authService";
import { formatDate } from "../../utils/format";

const ROLE_META = {
  ADMIN: { label: "Admin", icon: Shield, text: "text-[var(--color-teal-700)]", bg: "bg-[var(--color-mint-200)]/60" },
  DOKTER: { label: "Dokter", icon: Stethoscope, text: "text-[var(--color-gold)]", bg: "bg-[var(--color-gold-soft)]" },
};

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();

  return (
    <div>
      <PageHeader title="Pengaturan" description="Pengaturan klinik dan preferensi akun." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ProfileCard user={user} onSaved={updateUser} />
          <PasswordCard />
        </div>

        <AccountInfoCard user={user} onLogout={logout} />
      </div>
    </div>
  );
}

function ProfileCard({ user, onSaved }) {
  const [name, setName] = useState(user?.name || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const hasChanged = name.trim() !== "" && name !== user?.name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanged) return;
    setPending(true);
    setError(null);
    try {
      const result = await updateProfileRequest({ name: name.trim() });
      onSaved(result.user);
      toast.success("Profil diperbarui.");
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memperbarui profil.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-mint-200)] text-[var(--color-teal-700)]">
          <User size={16} />
        </span>
        <div>
          <h3 className="font-display text-[15px] font-bold text-[var(--color-ink)]">Profil Saya</h3>
          <p className="font-body text-xs text-[var(--color-muted)]">Nama yang tampil di seluruh aplikasi.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-body text-[13px] font-medium text-[var(--color-ink)]">
            Nama Lengkap
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-body text-[13px] font-medium text-[var(--color-ink)]">
            Email
          </label>
          <input
            value={user?.email || ""}
            disabled
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 font-body text-sm text-[var(--color-muted)] outline-none"
          />
          <p className="mt-1 font-body text-xs text-[var(--color-muted)]">
            Email tidak bisa diubah sendiri — hubungi admin kalau perlu diganti.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-[var(--color-coral-soft)] px-3.5 py-2.5 font-body text-[13px] text-[var(--color-coral)]">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!hasChanged || pending}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:opacity-50"
          >
            <Save size={15} />
            {pending ? "Menyimpan…" : "Simpan Profil"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.newPassword.length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setPending(true);
    try {
      await updateProfileRequest({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Kata sandi berhasil diganti.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengganti kata sandi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-coral-soft)] text-[var(--color-coral)]">
          <Lock size={16} />
        </span>
        <div>
          <h3 className="font-display text-[15px] font-bold text-[var(--color-ink)]">Ubah Kata Sandi</h3>
          <p className="font-body text-xs text-[var(--color-muted)]">Ganti kata sandi login kamu secara berkala.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-body text-[13px] font-medium text-[var(--color-ink)]">
            Kata Sandi Saat Ini
          </label>
          <input
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-body text-[13px] font-medium text-[var(--color-ink)]">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              required
              placeholder="Minimal 6 karakter"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-[13px] font-medium text-[var(--color-ink)]">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-[var(--color-coral-soft)] px-3.5 py-2.5 font-body text-[13px] text-[var(--color-coral)]">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:opacity-50"
          >
            <Lock size={15} />
            {pending ? "Menyimpan…" : "Ganti Kata Sandi"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AccountInfoCard({ user, onLogout }) {
  const meta = ROLE_META[user?.role] || ROLE_META.DOKTER;
  const Icon = meta.icon;

  return (
    <div className="h-fit rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-teal-700)] font-display text-2xl font-bold text-white">
          {user?.name?.charAt(0).toUpperCase()}
        </span>
        <p className="mt-3 font-display text-[16px] font-bold text-[var(--color-ink)]">{user?.name}</p>
        <p className="font-body text-xs text-[var(--color-muted)]">{user?.email}</p>
        <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-[12px] font-medium ${meta.bg} ${meta.text}`}>
          <Icon size={12} />
          {meta.label}
        </span>
      </div>

      <div className="mt-5 space-y-2 border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center justify-between font-body text-[13px]">
          <span className="text-[var(--color-muted)]">Bergabung sejak</span>
          <span className="text-[var(--color-ink)]">
            {user?.createdAt ? formatDate(user.createdAt, { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2.5 font-body text-sm font-semibold text-[var(--color-coral)] hover:bg-[var(--color-coral-soft)]"
      >
        <LogOut size={15} />
        Keluar
      </button>
    </div>
  );
}
