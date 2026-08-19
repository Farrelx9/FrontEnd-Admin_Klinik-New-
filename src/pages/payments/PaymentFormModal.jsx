import { useEffect, useState } from "react";
import { Wand2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/Modal";
import PatientPicker from "../../components/PatientPicker";
import CurrencyInput from "../../components/CurrencyInput";
import { createPayment, updatePayment } from "../../services/paymentService";
import MedicalRecordPicker from "./MedicalRecordPicker";

const METHOD_OPTIONS = [
  { value: "CASH", label: "Tunai" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "DEBIT", label: "Debit" },
  { value: "QRIS", label: "QRIS" },
];

const STATUS_OPTIONS = [
  { value: "UNPAID", label: "Belum Bayar" },
  { value: "PARTIAL", label: "DP / Sebagian" },
  { value: "PAID", label: "Lunas" },
];

function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// `defaultPatient` lets callers open the form pre-filled (e.g. later, a
// "Catat Pembayaran" shortcut from the patient detail modal).
export default function PaymentFormModal({ open, onClose, payment, defaultPatient, onSaved }) {
  const isEdit = Boolean(payment);
  const [patient, setPatient] = useState(null);
  const [medicalRecordId, setMedicalRecordId] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [status, setStatus] = useState("UNPAID");
  const [paidAt, setPaidAt] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (payment) {
      setPatient(payment.patient);
      setMedicalRecordId(payment.medicalRecordId || null);
      setAmount(payment.amount ?? "");
      setMethod(payment.method || "CASH");
      setStatus(payment.status || "UNPAID");
      setPaidAt(payment.paidAt ? payment.paidAt.slice(0, 10) : "");
    } else {
      setPatient(defaultPatient || null);
      setMedicalRecordId(null);
      setAmount("");
      setMethod("CASH");
      setStatus("UNPAID");
      setPaidAt("");
    }
    setErrors({});
    setSubmitError(null);
  }, [open, payment, defaultPatient]);

  // Changing patient invalidates whatever record was linked to the old one.
  const handlePatientChange = (p) => {
    setPatient(p);
    setMedicalRecordId(null);
  };

  const handleRecordChange = (id, total) => {
    setMedicalRecordId(id);
    if (id && total !== null) {
      setAmount(total);
      toast.success("Nominal diisi otomatis dari total kunjungan.", { icon: "💡" });
    }
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    // Paying in full/partially almost always means "today" unless
    // someone's backfilling — default it, but they can still edit it.
    if (value !== "UNPAID" && !paidAt) {
      setPaidAt(todayInput());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});

    if (!patient) {
      setSubmitError("Pilih pasien terlebih dahulu.");
      return;
    }
    if (amount === "") {
      setErrors({ amount: ["Nominal wajib diisi."] });
      return;
    }

    setPending(true);
    const payload = {
      patientId: patient.id,
      medicalRecordId: medicalRecordId || null,
      amount: Number(amount),
      method,
      status,
      paidAt: status === "UNPAID" ? null : paidAt || todayInput(),
    };

    try {
      const result = isEdit
        ? await updatePayment(payment.id, payload)
        : await createPayment(payload);
      onSaved(result.data);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setSubmitError(err.response?.data?.message || "Gagal menyimpan pembayaran.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Ubah Pembayaran" : "Catat Pembayaran"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Pasien" required>
          <PatientPicker value={patient} onChange={handlePatientChange} disabled={isEdit} />
        </Field>

        <Field label="Kunjungan Terkait">
          <div className="relative">
            <MedicalRecordPicker
              patientId={patient?.id}
              value={medicalRecordId}
              onChange={handleRecordChange}
            />
          </div>
          <p className="mt-1 flex items-center gap-1 font-body text-xs text-[var(--color-muted)]">
            <Wand2 size={11} />
            Pilih kunjungan biar nominal terisi otomatis — opsional, bisa dikosongkan.
          </p>
        </Field>

        <Field label="Nominal" required error={errors.amount?.[0]}>
          <CurrencyInput value={amount} onChange={setAmount} error={errors.amount?.[0]} />
        </Field>

        <Field label="Metode Pembayaran">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {METHOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMethod(opt.value)}
                className={`rounded-lg border px-2.5 py-2 font-body text-xs font-semibold transition-colors ${
                  method === opt.value
                    ? "border-[var(--color-teal-700)] bg-[var(--color-teal-700)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Status">
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusChange(opt.value)}
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

        {status !== "UNPAID" && (
          <Field label="Tanggal Bayar" error={errors.paidAt?.[0]}>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className={inputClass(errors.paidAt)}
            />
          </Field>
        )}

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
            {pending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Catat Pembayaran"}
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
