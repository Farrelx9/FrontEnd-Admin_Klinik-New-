import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Stethoscope,
  UserPlus,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import PageHeader from "../../components/PageHeader";
import { getInvoices } from "../../services/invoiceService";
import { getAllMedicalRecords } from "../../services/medicalRecordService";
import { getAllPatients } from "../../services/patientService";
import { formatCurrency, formatDate } from "../../utils/format";
import { exportReportToExcel } from "../../utils/exportXlsx";
import {
  getPresetRange,
  isWithinRange,
  eachDayInRange,
  todayInput,
} from "../../utils/dateRange";

const PRESETS = [
  { key: "today", label: "Hari Ini" },
  { key: "7days", label: "7 Hari Terakhir" },
  { key: "thisMonth", label: "Bulan Ini" },
  { key: "lastMonth", label: "Bulan Lalu" },
];

export default function ReportsPage() {
  const [range, setRange] = useState(getPresetRange("thisMonth"));
  const [activePreset, setActivePreset] = useState("thisMonth");
  const [exporting, setExporting] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getInvoices(), getAllMedicalRecords(), getAllPatients()])
      .then(([invoicesRes, recordsData, patientsData]) => {
        setInvoices(invoicesRes.data);
        setRecords(recordsData);
        setPatients(patientsData);
      })
      .catch((err) => setError(err.response?.data?.message || "Gagal memuat data laporan."))
      .finally(() => setLoading(false));
  }, []);

  const applyPreset = (key) => {
    setActivePreset(key);
    setRange(getPresetRange(key));
  };

  const handleCustomRange = (field, value) => {
    setActivePreset(null);
    setRange((r) => ({ ...r, [field]: value }));
  };

  // --- Aggregate everything for the selected range, client-side -------
  const paymentsInRange = useMemo(() => {
    const out = [];
    for (const inv of invoices) {
      for (const p of inv.payments || []) {
        if (isWithinRange(p.paidAt, range.start, range.end)) {
          out.push({ ...p, patientName: inv.patient?.name });
        }
      }
    }
    return out;
  }, [invoices, range]);

  const recordsInRange = useMemo(
    () => records.filter((r) => isWithinRange(r.visitDate, range.start, range.end)),
    [records, range]
  );

  const newPatientsInRange = useMemo(
    () => patients.filter((p) => isWithinRange(p.createdAt, range.start, range.end)),
    [patients, range]
  );

  const totalOutstanding = useMemo(
    () => invoices.reduce((sum, inv) => sum + Number(inv.remainingAmount || 0), 0),
    [invoices]
  );

  const totalRevenue = paymentsInRange.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const dailyRevenue = useMemo(() => {
    const days = eachDayInRange(range.start, range.end);
    const totals = Object.fromEntries(days.map((d) => [d, 0]));
    for (const p of paymentsInRange) {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      if (key in totals) totals[key] += Number(p.amount || 0);
    }
    return days.map((d) => ({
      date: d,
      label: formatDate(d, { day: "2-digit", month: "short" }),
      total: totals[d],
    }));
  }, [paymentsInRange, range]);

  const topServices = useMemo(() => {
    const tally = {};
    for (const r of recordsInRange) {
      for (const s of r.services || []) {
        const name = s.service?.name || "Lainnya";
        if (!tally[name]) tally[name] = { name, count: 0, revenue: 0 };
        tally[name].count += 1;
        tally[name].revenue += Number(s.priceAtTime || 0);
      }
    }
    return Object.values(tally)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [recordsInRange]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportReportToExcel({
        range,
        kpis: {
          revenue: totalRevenue,
          transactionCount: paymentsInRange.length,
          outstanding: totalOutstanding,
        },
        payments: paymentsInRange,
        topServices,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const maxTopServiceCount = Math.max(1, ...topServices.map((s) => s.count));

  return (
    <div>
      <PageHeader
        title="Laporan"
        description="Ringkasan kinerja operasional dan keuangan klinik."
        actions={
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || exporting || paymentsInRange.length === 0}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2.5 font-body text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40 disabled:opacity-50"
          >
            <FileSpreadsheet size={16} />
            {exporting ? "Menyiapkan file…" : "Export Excel"}
          </button>
        }
      />

      {/* Range selector */}
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              className={`rounded-full border px-3.5 py-1.5 font-body text-[13px] font-medium transition-colors ${
                activePreset === p.key
                  ? "border-[var(--color-teal-700)] bg-[var(--color-teal-700)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/30"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <input
            type="date"
            value={range.start}
            max={range.end}
            onChange={(e) => handleCustomRange("start", e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 font-body text-xs sm:text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)] shrink"
          />
          <span className="font-body text-xs text-[var(--color-muted)]">s/d</span>
          <input
            type="date"
            value={range.end}
            min={range.start}
            max={todayInput()}
            onChange={(e) => handleCustomRange("end", e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 font-body text-xs sm:text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)] shrink"
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-[var(--color-coral-soft)] px-4 py-2.5 font-body text-sm text-[var(--color-coral)]">
          {error}
        </p>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wallet} accent="teal" label="Pendapatan Periode Ini" value={loading ? null : formatCurrency(totalRevenue)} />
        <KpiCard icon={Stethoscope} accent="mint" label="Jumlah Kunjungan" value={loading ? null : String(recordsInRange.length)} />
        <KpiCard icon={UserPlus} accent="gold" label="Pasien Baru" value={loading ? null : String(newPatientsInRange.length)} />
        <KpiCard icon={AlertCircle} accent="coral" label="Sisa Piutang (Total)" value={loading ? null : formatCurrency(totalOutstanding)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 sm:p-5 lg:col-span-2 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-[15px] font-bold text-[var(--color-ink)]">
              Tren Pendapatan Harian
            </h3>
            <span className="flex items-center gap-1 font-body text-xs text-[var(--color-muted)]">
              <TrendingUp size={13} />
              {formatDate(range.start, { day: "2-digit", month: "short" })} – {formatDate(range.end, { day: "2-digit", month: "short" })}
            </span>
          </div>

          {loading ? (
            <div className="mt-4 h-64 animate-pulse rounded-lg bg-[var(--color-mint-200)]/20" />
          ) : dailyRevenue.every((d) => d.total === 0) ? (
            <div className="mt-4 flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] text-center">
              <Wallet size={18} className="text-[var(--color-muted)]" />
              <p className="font-body text-sm text-[var(--color-muted)]">
                Belum ada pembayaran tercatat di periode ini.
              </p>
            </div>
          ) : (
            <div className="mt-4 h-64 sm:h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                    minTickGap={22}
                    dy={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}rb` : v)}
                    width={42}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--color-border)",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="total" fill="var(--color-teal-600)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top services */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-display text-[15px] font-bold text-[var(--color-ink)]">
            Layanan Terpopuler
          </h3>

          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-[var(--color-mint-200)]/30" />
              ))}
            </div>
          ) : topServices.length === 0 ? (
            <div className="mt-4 flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] text-center">
              <Stethoscope size={18} className="text-[var(--color-muted)]" />
              <p className="font-body text-sm text-[var(--color-muted)]">
                Belum ada tindakan tercatat di periode ini.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {topServices.map((s) => (
                <li key={s.name}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate font-body text-[13px] font-medium text-[var(--color-ink)]">
                      {s.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs font-semibold text-[var(--color-teal-700)]">
                      {s.count}×
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-teal-600)]"
                      style={{ width: `${(s.count / maxTopServiceCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, accent, label, value }) {
  const ACCENT = {
    teal: "bg-[var(--color-teal-700)] text-white",
    mint: "bg-[var(--color-mint-200)] text-[var(--color-teal-700)]",
    gold: "bg-[var(--color-gold-soft)] text-[var(--color-gold)]",
    coral: "bg-[var(--color-coral-soft)] text-[var(--color-coral)]",
  };
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${ACCENT[accent]}`}>
        <Icon size={18} />
      </span>
      <p className="mt-4 font-display text-2xl font-bold text-[var(--color-ink)]">
        {value === null ? (
          <span className="inline-block h-7 w-20 animate-pulse rounded bg-[var(--color-mint-200)]/50 align-middle" />
        ) : (
          value
        )}
      </p>
      <p className="mt-1 font-body text-[13px] text-[var(--color-muted)]">{label}</p>
    </div>
  );
}
