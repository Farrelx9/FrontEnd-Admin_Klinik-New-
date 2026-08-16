import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import PatientPicker from "../../components/PatientPicker";
import DoctorSelect from "../../components/DoctorSelect";
import { createAppointment, updateAppointment } from "../../services/appointmentService";
import DatePicker from "../../components/DatePicker";

const QUICK_TIMES = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Terjadwal" },
  { value: "DONE", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
  { value: "NO_SHOW", label: "Tidak Hadir" },
];

// See AppointmentsPage.jsx for why this avoids toISOString() — it forces
// UTC and can roll the displayed date back a day in WIB (UTC+7).
function toDateInput(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function toTimeInput(d) {
  return d.toTimeString().slice(0, 5);
}

// `defaultDate` pre-fills the date field when creating from a specific
// day view (e.g. clicking "+ Tambah" while browsing Tuesday's schedule).
export default function AppointmentFormModal({
  open,
  onClose,
  appointment,
  defaultDate,
  onSaved,
}) {
  const isEdit = Boolean(appointment);
  const [patient, setPatient] = useState(null);
  const [dokterId, setDokterId] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [status, setStatus] = useState("SCHEDULED");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (appointment) {
      const dt = new Date(appointment.scheduledAt);
      setPatient(appointment.patient);
      setDokterId(appointment.dokterId || null);
      setDate(toDateInput(dt));
      setTime(toTimeInput(dt));
      setStatus(appointment.status || "SCHEDULED");
      setNotes(appointment.notes || "");
    } else {
      setPatient(null);
      setDokterId(null);
      setDate(defaultDate || toDateInput(new Date()));
      setTime("09:00");
      setStatus("SCHEDULED");
      setNotes("");
    }
    setErrors({});
    setSubmitError(null);
  }, [open, appointment, defaultDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});

    if (!patient) {
      setSubmitError("Pilih pasien terlebih dahulu.");
      return;
    }
    if (!date || !time) {
      setSubmitError("Tanggal dan jam kunjungan wajib diisi.");
      return;
    }

    setPending(true);
    const payload = {
      patientId: patient.id,
      dokterId,
      scheduledAt: new Date(`${date}T${time}:00`).toISOString(),
      status,
      notes: notes || null,
    };

    try {
      const result = isEdit
        ? await updateAppointment(appointment.id, payload)
        : await createAppointment(payload);
      onSaved(result.data);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setSubmitError(err.response?.data?.message || "Gagal menyimpan jadwal.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Ubah Jadwal Kunjungan" : "Tambah Jadwal Kunjungan"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Pasien" required>
          <PatientPicker value={patient} onChange={setPatient} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tanggal" required error={errors.scheduledAt?.[0]}>
            <DatePicker
              value={date}
              onChange={setDate}
              variant="medium"
              className="w-full"
            />
          </Field>
          <Field label="Jam" required>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass()}
            />
          </Field>
        </div>

        {/* Quick Time Slots */}
        <div>
          <label className="mb-1.5 block font-body text-xs font-medium text-[var(--color-muted)]">
            Slot Jam Cepat
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={`rounded-md border px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                  time === t
                    ? "border-[var(--color-teal-700)] bg-[var(--color-teal-700)] text-white"
                    : "border-[var(--color-border)] bg-[var(--color-bg)]/50 text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Field label="Dokter" error={errors.dokterId?.[0]}>
          <DoctorSelect value={dokterId} onChange={setDokterId} error={errors.dokterId?.[0]} />
        </Field>

        {isEdit && (
          <Field label="Status">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`rounded-lg border px-2.5 py-2 font-body text-xs font-semibold transition-colors ${
                    status === opt.value
                      ? "border-[var(--color-teal-700)] bg-[var(--color-teal-700)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Catatan" error={errors.notes?.[0]}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Catatan tambahan, kalau ada"
            className={inputClass(errors.notes)}
          />
        </Field>

        {submitError && (
          <p
            role="alert"
            className="rounded-lg bg-[var(--color-coral-soft)] px-3.5 py-2.5 font-body text-[13px] text-[var(--color-coral)]"
          >
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 font-body text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[var(--color-teal-700)] px-5 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:opacity-60"
          >
            {pending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Jadwal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block font-body text-[13px] font-medium text-[var(--color-ink)]">
        {label} {required && <span className="text-[var(--color-coral)]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 font-body text-xs text-[var(--color-coral)]">{error}</p>}
    </div>
  );
}

function inputClass(hasError) {
  return `w-full rounded-lg border bg-[var(--color-surface)] px-3.5 py-2.5 font-body text-sm text-[var(--color-ink)] outline-none transition-shadow placeholder:text-[var(--color-muted)]/70 focus:ring-2 focus:ring-[var(--color-teal-500)] ${
    hasError ? "border-[var(--color-coral)]" : "border-[var(--color-border)]"
  }`;
}
