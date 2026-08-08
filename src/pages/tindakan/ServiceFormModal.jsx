import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import { createService, updateService } from "../../services/serviceService";

const EMPTY_FORM = { name: "", description: "", price: "" };

export default function ServiceFormModal({ open, onClose, service, onSaved }) {
  const isEdit = Boolean(service);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      service
        ? {
            name: service.name || "",
            description: service.description || "",
            price: service.price ?? "",
          }
        : EMPTY_FORM
    );
    setErrors({});
    setSubmitError(null);
  }, [open, service]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setSubmitError(null);

    const payload = { ...form, price: Number(form.price) };

    try {
      const result = isEdit
        ? await updateService(service.id, payload)
        : await createService(payload);
      onSaved(result.data);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setSubmitError(
          err.response?.data?.message || "Gagal menyimpan layanan."
        );
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Ubah Layanan" : "Tambah Layanan"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Layanan" required error={errors.name?.[0]}>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Misal: Scaling Gigi"
            className={inputClass(errors.name)}
          />
        </Field>

        <Field label="Deskripsi" error={errors.description?.[0]}>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            placeholder="Deskripsi singkat layanan (opsional)"
            className={inputClass(errors.description)}
          />
        </Field>

        <Field label="Harga (Rp)" required error={errors.price?.[0]}>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            min="0"
            step="1000"
            placeholder="0"
            className={`${inputClass(errors.price)} font-mono`}
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
            {pending
              ? "Menyimpan…"
              : isEdit
              ? "Simpan Perubahan"
              : "Tambah Layanan"}
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
        {label}{" "}
        {required && <span className="text-[var(--color-coral)]">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 font-body text-xs text-[var(--color-coral)]">
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(hasError) {
  return `w-full rounded-lg border bg-[var(--color-surface)] px-3.5 py-2.5 font-body text-sm text-[var(--color-ink)] outline-none transition-shadow placeholder:text-[var(--color-muted)]/70 focus:ring-2 focus:ring-[var(--color-teal-500)] ${
    hasError ? "border-[var(--color-coral)]" : "border-[var(--color-border)]"
  }`;
}
