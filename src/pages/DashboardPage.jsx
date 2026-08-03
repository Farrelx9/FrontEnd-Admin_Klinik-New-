import { CalendarClock, Users, Stethoscope, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

const STATS = [
  { label: "Kunjungan Hari Ini", value: "12", icon: CalendarClock, accent: "teal" },
  { label: "Pasien Terdaftar", value: "348", icon: Users, accent: "mint" },
  { label: "Tindakan Bulan Ini", value: "97", icon: Stethoscope, accent: "gold" },
  { label: "Pendapatan Bulan Ini", value: "Rp 42,6jt", icon: Wallet, accent: "coral" },
];

const ACCENT_STYLES = {
  teal: "bg-[var(--color-teal-700)] text-white",
  mint: "bg-[var(--color-mint-200)] text-[var(--color-teal-700)]",
  gold: "bg-[var(--color-gold-soft)] text-[var(--color-gold)]",
  coral: "bg-[var(--color-coral-soft)] text-[var(--color-coral)]",
};

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Halo, ${user?.name || "Staf"} 👋`}
        description="Ringkasan operasional klinik hari ini."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${ACCENT_STYLES[accent]}`}
            >
              <Icon size={18} />
            </span>
            <p className="mt-4 font-display text-2xl font-bold text-[var(--color-ink)]">
              {value}
            </p>
            <p className="mt-1 font-body text-[13px] text-[var(--color-muted)]">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:col-span-2">
          <h3 className="font-display text-[15px] font-bold text-[var(--color-ink)]">
            Jadwal Kunjungan Berikutnya
          </h3>
          <p className="mt-1 font-body text-[13px] text-[var(--color-muted)]">
            Data akan tampil di sini setelah API jadwal tersambung.
          </p>
          <div className="mt-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] font-body text-sm text-[var(--color-muted)]">
            Belum ada data
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-display text-[15px] font-bold text-[var(--color-ink)]">
            Aktivitas Terbaru
          </h3>
          <p className="mt-1 font-body text-[13px] text-[var(--color-muted)]">
            Log aktivitas staf &amp; sistem.
          </p>
          <div className="mt-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] font-body text-sm text-[var(--color-muted)]">
            Belum ada data
          </div>
        </div>
      </div>
    </div>
  );
}
