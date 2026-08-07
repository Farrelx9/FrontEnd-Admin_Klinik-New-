import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import PatientPicker from "../../components/PatientPicker";
import { getServices } from "../../services/serviceService";
import { createMedicalRecord, updateMedicalRecord } from "../../services/medicalRecordService";
import { formatCurrency } from "../../utils/format";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  complaint: "",
  diagnosis: "",
  treatment: "",
  notes: "",
  visitDate: todayInputValue(),
};

// `record` is null in create mode, or an existing record (with `patient`
// and `services` already included) in edit mode. `defaultPatient` lets
// callers open the form pre-filled with a patient (e.g. from the patient
// detail modal's "Tambah Rekam Medis" action).
export default function MedicalRecordFormModal({
  open,
  onClose,
  record,
  defaultPatient,
  onSaved,
}) {
  const isEdit = Boolean(record);
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [allServices, setAllServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]); // [{serviceId, toothNumber}]
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    getServices().then((res) => setAllServices(res.data)).catch(() => setAllServices([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setPatient(record.patient);
      setForm({
        complaint: record.complaint || "",
        diagnosis: record.diagnosis || "",
        treatment: record.treatment || "",
        notes: record.notes || "",
        visitDate: record.visitDate ? record.visitDate.slice(0, 10) : todayInputValue(),
      });
      setSelectedServices(
        (record.services || []).map((s) => ({
          serviceId: s.serviceId,
          toothNumber: s.toothNumber || "",
        }))
      );
    } else {
      setPatient(defaultPatient || null);
      setForm(EMPTY_FORM);
      setSelectedServices([]);
    }
    setErrors({});
    setSubmitError(null);
  }, [open, record, defaultPatient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const isServiceSelected = (serviceId) =>
    selectedServices.some((s) => s.serviceId === serviceId);

  const toggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.serviceId === serviceId)
        ? prev.filter((s) => s.serviceId !== serviceId)
        : [...prev, { serviceId, toothNumber: "" }]
    );
  };

  const setToothNumber = (serviceId, toothNumber) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, toothNumber } : s))
    );
  };

  const total = selectedServices.reduce((sum, sel) => {
    const service = allServices.find((s) => s.id === sel.serviceId);
    return sum + (service ? Number(service.price) : 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});

    if (!patient) {
      setSubmitError("Pilih pasien terlebih dahulu.");
      return;
    }

    setPending(true);
    const payload = {
      patientId: patient.id,
      ...form,
      services: selectedServices.map((s) => ({
        serviceId: s.serviceId,
        toothNumber: s.toothNumber || null,
      })),
    };

    try {
      const result = isEdit
        ? await updateMedicalRecord(record.id, payload)
        : await createMedicalRecord(payload);
      onSaved(result.data);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setSubmitError(err.response?.data?.message || "Gagal menyimpan rekam medis.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Ubah Rekam Medis" : "Tambah Rekam Medis"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Pasien" required>
          <PatientPicker value={patient} onChange={setPatient} disabled={isEdit} />
          {isEdit && (
            <p className="mt-1 font-body text-xs text-[var(--color-muted)]">
              Pasien tidak bisa diubah setelah rekam medis dibuat.
            </p>
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tanggal Kunjungan" error={errors.visitDate?.[0]}>
            <input
              type="date"
              name="visitDate"
              value={form.visitDate}
              onChange={handleChange}
              className={inputClass(errors.visitDate)}
            />
          </Field>
          <Field label="Keluhan" error={errors.complaint?.[0]}>
            <input
              name="complaint"
              value={form.complaint}
              onChange={handleChange}
              placeholder="Keluhan utama pasien"
              className={inputClass(errors.complaint)}
            />
          </Field>
        </div>

        <Field label="Diagnosis" error={errors.diagnosis?.[0]}>
          <input
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            placeholder="Diagnosis dokter"
            className={inputClass(errors.diagnosis)}
          />
        </Field>

        <Field label="Tindakan / Terapi" error={errors.treatment?.[0]}>
          <textarea
            name="treatment"
            value={form.treatment}
            onChange={handleChange}
            rows={2}
            placeholder="Ringkasan tindakan yang dilakukan"
            className={inputClass(errors.treatment)}
          />
        </Field>

        {/* Treatment line items — tied to the services/tariff catalog so
            billing stays consistent with what Pembayaran will show. */}
        <div>
          <label className="mb-1.5 block font-body text-[13px] font-medium text-[var(--color-ink)]">
            Layanan yang Dilakukan
          </label>
          {allServices.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--color-border)] px-3.5 py-3 font-body text-sm text-[var(--color-muted)]">
              Belum ada data layanan. Tambahkan dulu di halaman Layanan & Tindakan.
            </p>
          ) : (
            <div className="rounded-lg border border-[var(--color-border)]">
              <ul className="divide-y divide-[var(--color-border)]">
                {allServices.map((service) => {
                  const selected = selectedServices.find((s) => s.serviceId === service.id);
                  return (
                    <li key={service.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                      <label className="flex flex-1 items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={Boolean(selected)}
                          onChange={() => toggleService(service.id)}
                          className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-teal-700)] focus:ring-[var(--color-teal-500)]"
                        />
                        <span className="font-body text-sm text-[var(--color-ink)]">
                          {service.name}
                        </span>
                        <span className="font-mono text-xs text-[var(--color-muted)]">
                          {formatCurrency(service.price)}
                        </span>
                      </label>
                      {selected && (
                        <input
                          value={selected.toothNumber}
                          onChange={(e) => setToothNumber(service.id, e.target.value)}
                          placeholder="No. gigi"
                          className="w-24 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
              {selectedServices.length > 0 && (
                <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5">
                  <span className="font-body text-xs font-medium text-[var(--color-muted)]">
                    Total {selectedServices.length} layanan
                  </span>
                  <span className="font-mono text-sm font-semibold text-[var(--color-ink)]">
                    {formatCurrency(total)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <Field label="Catatan Tambahan" error={errors.notes?.[0]}>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Catatan lain, kalau ada"
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
            {pending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Simpan Rekam Medis"}
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
