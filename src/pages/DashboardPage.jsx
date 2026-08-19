import { useEffect, useState } from "react";
import { CalendarClock, Users, Stethoscope, Wallet, Clock, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import { getPatients } from "../services/patientService";
import { getAppointments } from "../services/appointmentService";
import { getAllMedicalRecords } from "../services/medicalRecordService";
import { formatCurrency, formatDate } from "../utils/format";

// Same local-date derivation used on the Jadwal page — avoids the
// toISOString() timezone bug (UTC conversion can roll the date back a
// day in WIB).
function todayDateInput() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameMonth(dateValue, ref) {
  const d = new Date(dateValue);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

const ACCENT_STYLES = {
  teal: "bg-[var(--color-teal-700)] text-white",
  mint: "bg-[var(--color-mint-200)] text-[var(--color-teal-700)]",
  gold: "bg-[var(--color-gold-soft)] text-[var(--color-gold)]",
  coral: "bg-[var(--color-coral-soft)] text-[var(--color-coral)]",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [patientTotal, setPatientTotal] = useState(0);
  const [monthRecords, setMonthRecords] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    const today = todayDateInput();
    const now = new Date();

    setLoading(true);
    setError(null);

    Promise.all([
      getAppointments({ date: today }),
      getPatients({ page: 1, pageSize: 1 }),
      getAllMedicalRecords(),
    ])
      .then(([appointmentsRes, patientsRes, allRecords]) => {
        setTodayAppointments(appointmentsRes.data);
        setPatientTotal(patientsRes.meta.total);

        // allRecords already comes newest-first from the API.
        setRecentRecords(allRecords.slice(0, 5));
        setMonthRecords(allRecords.filter((r) => isSameMonth(r.visitDate, now)));
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Gagal memuat ringkasan dashboard.");
      })
      .finally(() => setLoading(false));
  }, []);

  const monthRevenue = monthRecords.reduce(
    (sum, r) => sum + (r.services || []).reduce((s, item) => s + Number(item.priceAtTime || 0), 0),
    0
  );

  const upcomingToday = todayAppointments
    .filter((a) => a.status === "SCHEDULED")
    .slice(0, 5);

  const stats = [
    {
      label: "Kunjungan Hari Ini",
      value: loading ? "—" : String(todayAppointments.length),
      icon: CalendarClock,
      accent: "teal",
    },
    {
      label: "Pasien Terdaftar",
      value: loading ? "—" : String(patientTotal),
      icon: Users,
      accent: "mint",
    },
    {
      label: "Tindakan Bulan Ini",
      value: loading ? "—" : String(monthRecords.length),
      icon: Stethoscope,
      accent: "gold",
    },
    {
      label: "Pendapatan Bulan Ini",
      value: loading ? "—" : formatCurrency(monthRevenue),
      icon: Wallet,
      accent: "coral",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Halo, ${user?.name || "Staf"} 👋`}
        description="Ringkasan operasional klinik hari ini."
      />

      {error && (
        <p className="mb-4 rounded-lg bg-[var(--color-coral-soft)] px-4 py-2.5 font-body text-sm text-[var(--color-coral)]">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
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
              {loading ? (
                <span className="inline-block h-7 w-16 animate-pulse rounded bg-[var(--color-mint-200)]/50 align-middle" />
              ) : (
                value
              )}
            </p>
            <p className="mt-1 font-body text-[13px] text-[var(--color-muted)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Jadwal kunjungan berikutnya (hari ini) */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[15px] font-bold text-[var(--color-ink)]">
              Jadwal Kunjungan Hari Ini
            </h3>
            <Link
              to="/jadwal"
              className="flex items-center gap-1 font-body text-xs font-semibold text-[var(--color-teal-700)] hover:underline"
            >
              Lihat semua
              <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--color-mint-200)]/30" />
              ))}
            </div>
          ) : upcomingToday.length === 0 ? (
            <div className="mt-4 flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] text-center">
              <Clock size={18} className="text-[var(--color-muted)]" />
              <p className="font-body text-sm text-[var(--color-muted)]">
                Tidak ada jadwal terjadwal untuk hari ini.
              </p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-border)]">
              {upcomingToday.map((appt) => (
                <li key={appt.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-14 shrink-0 font-mono text-sm font-bold text-[var(--color-ink)]">
                    {new Date(appt.scheduledAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
                      {appt.patient?.name}
                    </p>
                    {appt.dokter?.name && (
                      <p className="truncate font-body text-xs text-[var(--color-muted)]">
                        drg. {appt.dokter.name}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Aktivitas terbaru */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[15px] font-bold text-[var(--color-ink)]">
              Aktivitas Terbaru
            </h3>
            <Link
              to="/rekam-medis"
              className="flex items-center gap-1 font-body text-xs font-semibold text-[var(--color-teal-700)] hover:underline"
            >
              Lihat semua
              <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--color-mint-200)]/30" />
              ))}
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="mt-4 flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] text-center">
              <FileText size={18} className="text-[var(--color-muted)]" />
              <p className="font-body text-sm text-[var(--color-muted)]">
                Belum ada rekam medis tercatat.
              </p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--color-border)]">
              {recentRecords.map((r) => (
                <li key={r.id} className="py-2.5">
                  <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
                    {r.patient?.name}
                  </p>
                  <p className="truncate font-body text-xs text-[var(--color-muted)]">
                    {r.diagnosis || r.complaint || "Kunjungan"} · {formatDate(r.visitDate, { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
