import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Phone,
  Pencil,
  Trash2,
  Check,
  X as XIcon,
  UserX,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import { getAppointments, updateAppointment, deleteAppointment } from "../../services/appointmentService";
import AppointmentFormModal from "./AppointmentFormModal";
import DatePicker from "../../components/DatePicker";

const STATUS_META = {
  SCHEDULED: { label: "Terjadwal", dot: "bg-[var(--color-teal-600)]", text: "text-[var(--color-teal-700)]", bg: "bg-[var(--color-mint-200)]/50", border: "border-[var(--color-teal-600)]" },
  DONE: { label: "Selesai", dot: "bg-emerald-600", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-500" },
  CANCELLED: { label: "Dibatalkan", dot: "bg-[var(--color-coral)]", text: "text-[var(--color-coral)]", bg: "bg-[var(--color-coral-soft)]", border: "border-[var(--color-coral)]" },
  NO_SHOW: { label: "Tidak Hadir", dot: "bg-[var(--color-gold)]", text: "text-[var(--color-gold)]", bg: "bg-[var(--color-gold-soft)]", border: "border-[var(--color-gold)]" },
};

const STATUS_TABS = [
  { value: null, label: "Semua" },
  { value: "SCHEDULED", label: "Terjadwal" },
  { value: "DONE", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
  { value: "NO_SHOW", label: "Tidak Hadir" },
];

// IMPORTANT: build the YYYY-MM-DD string from local date parts, not
// `.toISOString()`. toISOString() always converts to UTC — for WIB
// (UTC+7) that can roll the date back by a day (e.g. right after
// midnight local time), which made the prev/next arrows look broken.
function toDateInput(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return toDateInput(d);
}

function formatLongDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function getWeekDays(dateStr) {
  const current = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = current.getDay();
  const distToMon = (dayOfWeek + 6) % 7;
  const monday = new Date(current);
  monday.setDate(monday.getDate() - distToMon);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: toDateInput(d),
      dayName: d.toLocaleDateString("id-ID", { weekday: "short" }),
      dayNum: d.getDate(),
    });
  }
  return days;
}

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(toDateInput(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  // Fetch the whole day unfiltered by status — status tabs then filter
  // client-side, so switching tabs is instant and we can show counts per
  // status without extra round trips. A single day's appointment count is
  // small enough that this is cheap.
  const fetchDay = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getAppointments({ date: selectedDate });
      setAppointments(res.data);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Gagal memuat jadwal. Cek koneksi ke server.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDay();
  }, [fetchDay]);

  const visible = statusFilter ? appointments.filter((a) => a.status === statusFilter) : appointments;
  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const openCreate = () => {
    setEditingAppointment(null);
    setFormOpen(true);
  };

  const openEdit = (appt) => {
    setEditingAppointment(appt);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    toast.success(editingAppointment ? "Jadwal diperbarui." : "Jadwal ditambahkan.");
    fetchDay();
  };

  const handleQuickStatus = async (appt, status) => {
    // Optimistic update so the click feels instant; roll back on failure.
    const prev = appointments;
    setAppointments((list) => list.map((a) => (a.id === appt.id ? { ...a, status } : a)));
    try {
      await updateAppointment(appt.id, { status });
    } catch (err) {
      setAppointments(prev);
      toast.error(err.response?.data?.message || "Gagal mengubah status.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteAppointment(deleteTarget.id);
      toast.success("Jadwal dihapus.");
      setDeleteTarget(null);
      fetchDay();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus jadwal.");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Jadwal Kunjungan"
        description="Jadwal kunjungan pasien dan ketersediaan dokter."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
          >
            <Plus size={16} />
            Tambah Jadwal
          </button>
        }
      />

      {/* Date Navigator & Week Strip */}
      <div className="mb-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40 transition-colors"
              aria-label="Hari sebelumnya"
              title="Hari Sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>

            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              variant="medium"
              className="min-w-[190px]"
            />

            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40 transition-colors"
              aria-label="Hari berikutnya"
              title="Hari Berikutnya"
            >
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(toDateInput(new Date()))}
              className="ml-1 shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-2 font-body text-xs font-semibold text-[var(--color-teal-700)] hover:bg-[var(--color-mint-200)]/40 transition-colors"
            >
              Hari Ini
            </button>
          </div>

          <div className="hidden font-display text-sm font-semibold text-[var(--color-ink)] sm:block">
            {formatLongDate(selectedDate)}
          </div>
        </div>

        {/* Horizontal 7-Day Week Strip */}
        <div className="mt-3.5 pt-3 border-t border-[var(--color-border)]/60 flex items-center justify-between gap-1.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-7 sm:gap-2">
          {getWeekDays(selectedDate).map((item) => {
            const isSelected = item.dateStr === selectedDate;
            const isToday = item.dateStr === toDateInput(new Date());
            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => setSelectedDate(item.dateStr)}
                className={`flex flex-col items-center justify-center rounded-lg py-2 min-w-[46px] shrink-0 sm:min-w-0 sm:shrink transition-all ${
                  isSelected
                    ? "bg-[var(--color-teal-700)] text-white font-bold shadow-xs scale-[1.02]"
                    : isToday
                    ? "border border-[var(--color-teal-600)] text-[var(--color-teal-700)] bg-[var(--color-mint-200)]/30 hover:bg-[var(--color-mint-200)]/70 font-semibold"
                    : "bg-[var(--color-bg)]/60 text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
                }`}
              >
                <span className={`text-[11px] uppercase tracking-wider ${isSelected ? "text-white/80" : "text-[var(--color-muted)]"}`}>
                  {item.dayName}
                </span>
                <span className="text-sm sm:text-base font-bold leading-tight">
                  {item.dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.value;
          const count = tab.value ? counts[tab.value] || 0 : appointments.length;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-body text-[13px] font-medium transition-colors ${
                active
                  ? "border-[var(--color-teal-700)] bg-[var(--color-teal-700)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/30"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  active ? "bg-white/20" : "bg-[var(--color-bg)]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(22,41,42,0.04)]">
        {loading ? (
          <ListSkeleton />
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-body text-sm text-[var(--color-coral)]">{loadError}</p>
            <button
              onClick={fetchDay}
              className="mt-3 rounded-lg border border-[var(--color-border)] px-4 py-2 font-body text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
            >
              Coba lagi
            </button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState hasFilter={Boolean(statusFilter)} onAdd={openCreate} />
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {visible.map((appt, idx) => {
              const meta = STATUS_META[appt.status] || STATUS_META.SCHEDULED;
              const isLast = idx === visible.length - 1;
              return (
                <li
                  key={appt.id}
                  className={`flex flex-col gap-3 border-l-4 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-5 sm:px-5 transition-colors hover:bg-[var(--color-bg)]/30 ${meta.border} ${
                    idx === 0 ? "rounded-t-xl" : ""
                  } ${isLast ? "rounded-b-xl" : ""}`}
                >
                  {/* Time Badge */}
                  <div className="flex shrink-0 items-center justify-between sm:justify-start">
                    <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/80 px-2.5 py-1.5 font-mono text-sm font-bold text-[var(--color-ink)] shadow-2xs">
                      <Clock size={14} className="text-[var(--color-teal-600)]" />
                      <span>{formatTime(appt.scheduledAt)}</span>
                    </div>
                  </div>

                  {/* Patient & Doctor Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-display text-sm font-bold text-[var(--color-ink)]">
                        {appt.patient?.name || "Pasien"}
                      </p>
                      {appt.dokter?.name && (
                        <span className="rounded-md bg-[var(--color-mint-200)]/50 px-2 py-0.5 font-body text-[11px] font-semibold text-[var(--color-teal-700)]">
                          drg. {appt.dokter.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-[var(--color-muted)]">
                      {appt.patient?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-[var(--color-teal-600)]" />
                          {appt.patient.phone}
                        </span>
                      )}
                    </div>
                    {appt.notes && (
                      <p className="mt-1.5 truncate font-body text-xs italic text-[var(--color-muted)]">
                        "{appt.notes}"
                      </p>
                    )}
                  </div>

                  {/* Quick Status & Actions */}
                  <div className="flex items-center justify-between gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]/50 sm:justify-end shrink-0">
                    <StatusMenu appt={appt} meta={meta} onChange={handleQuickStatus} isLastItem={isLast} />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(appt)}
                        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/50 hover:text-[var(--color-teal-700)] transition-colors"
                        aria-label="Ubah jadwal"
                        title="Ubah Jadwal"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(appt)}
                        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)] transition-colors"
                        aria-label="Hapus jadwal"
                        title="Hapus Jadwal"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AppointmentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        appointment={editingAppointment}
        defaultDate={selectedDate}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        pending={deletePending}
        title="Hapus jadwal ini?"
        description={
          deleteTarget
            ? `Jadwal kunjungan ${deleteTarget.patient?.name} pada ${formatTime(deleteTarget.scheduledAt)} akan dihapus permanen.`
            : undefined
        }
      />
    </div>
  );
}

// Small popover on the status badge itself — lets staff mark a visit
// done / cancelled / no-show in one click without opening the full edit
// form, since that's the single most frequent action on this page.
function StatusMenu({ appt, meta, onChange, isLastItem }) {
  const [open, setOpen] = useState(false);

  const QUICK_ACTIONS = [
    { value: "DONE", label: "Selesai", icon: Check },
    { value: "CANCELLED", label: "Batalkan", icon: XIcon },
    { value: "NO_SHOW", label: "Tidak Hadir", icon: UserX },
  ].filter((a) => a.value !== appt.status);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-xs font-semibold transition-all hover:shadow-xs ${meta.bg} ${meta.text}`}
      >
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
        {meta.label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className={`absolute left-0 sm:left-auto sm:right-0 z-40 w-44 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white p-1 shadow-lg animate-fade-in-up ${
              isLastItem ? "bottom-full mb-1.5" : "bottom-full mb-1.5 sm:bottom-auto sm:top-full sm:mt-1.5"
            }`}
          >
            {QUICK_ACTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  onChange(appt, value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-body text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40 transition-colors"
              >
                <Icon size={14} className="text-[var(--color-teal-600)]" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="h-4 w-12 shrink-0 animate-pulse rounded bg-[var(--color-mint-200)]/60" />
          <div className="h-4 w-40 animate-pulse rounded bg-[var(--color-mint-200)]/40" />
          <div className="ml-auto h-6 w-20 shrink-0 animate-pulse rounded-full bg-[var(--color-mint-200)]/40" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilter, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-mint-200)] text-[var(--color-teal-700)]">
        <CalendarDays size={22} />
      </span>
      <p className="mt-3 font-display text-[15px] font-semibold text-[var(--color-ink)]">
        {hasFilter ? "Tidak ada jadwal dengan status ini" : "Belum ada jadwal di tanggal ini"}
      </p>
      <p className="mt-1 max-w-xs font-body text-sm text-[var(--color-muted)]">
        {hasFilter
          ? "Coba pilih status lain, atau tambahkan jadwal baru."
          : "Tambahkan jadwal kunjungan pasien untuk tanggal ini."}
      </p>
      <button
        onClick={onAdd}
        className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
      >
        <Plus size={16} />
        Tambah Jadwal
      </button>
    </div>
  );
}
