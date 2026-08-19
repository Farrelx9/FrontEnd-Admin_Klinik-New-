import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import PatientPicker from "../../components/PatientPicker";
import CurrencyInput from "../../components/CurrencyInput";
import { createInvoice, updateInvoice } from "../../services/invoiceService";
import MedicalRecordPicker from "./MedicalRecordPicker";

// `defaultPatient` lets callers open the form pre-filled (e.g. later, a
// "Buat Tagihan" shortcut from the patient detail modal).
export default function InvoiceFormModal({ open, onClose, invoice, defaultPatient, onSaved }) {
  const isEdit = Boolean(invoice);
  const [patient, setPatient] = useState(null);
  const [medicalRecordId, setMedicalRecordId] = useState(null);
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (invoice) {
      setPatient(invoice.patient);
      setMedicalRecordId(invoice.medicalRecordId || null);
      setTotalAmount(invoice.totalAmount ?? "");
      setNotes(invoice.notes || "");
    } else {
      setPatient(defaultPatient || null);
      setMedicalRecordId(null);
      setTotalAmount("");
      setNotes("");
    }
    setErrors({});
    setSubmitError(null);
  }, [open, invoice, defaultPatient]);

  const handlePatientChange = (p) => {
    setPatient(p);
    setMedicalRecordId(null);
  };

  const handleRecordChange = (id, total) => {
    setMedicalRecordId(id);
    if (id && total !== null) {
      setTotalAmount(total);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});

    if (!isEdit && !patient) {
      setSubmitError("Pilih pasien terlebih dahulu.");
      return;
    }
    if (totalAmount === "") {
      setErrors({ totalAmount: ["Total tagihan wajib diisi."] });
      return;
    }

    setPending(true);
    try {
      const result = isEdit
        ? await updateInvoice(invoice.id, { totalAmount: Number(totalAmount), notes: notes || null })
        : await createInvoice({
            patientId: patient.id,
            medicalRecordId,
            totalAmount: Number(totalAmount),
            notes: notes || null,
          });
      onSaved(result.data);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setSubmitError(err.response?.data?.message || "Gagal menyimpan tagihan.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Ubah Tagihan" : "Buat Tagihan"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Pasien" required>
          <PatientPicker value={patient} onChange={handlePatientChange} disabled={isEdit} />
          {isEdit && (
            <p className="mt-1 font-body text-xs text-[var(--color-muted)]">
              Pasien tidak bisa diubah setelah tagihan dibuat.
            </p>
          )}
        </Field>

        {!isEdit && (
          <Field label="Kunjungan Terkait">
            <MedicalRecordPicker
              patientId={patient?.id}
              value={medicalRecordId}
              onChange={handleRecordChange}
            />
            <p className="mt-1 font-body text-xs text-[var(--color-muted)]">
              Opsional — pilih biar total tagihan terisi otomatis dari total kunjungan itu.
            </p>
          </Field>
        )}

        <Field label="Total Tagihan" required error={errors.totalAmount?.[0]}>
          <CurrencyInput
            value={totalAmount}
            onChange={setTotalAmount}
            error={errors.totalAmount?.[0]}
          />
        </Field>

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
            {pending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Buat Tagihan"}
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
