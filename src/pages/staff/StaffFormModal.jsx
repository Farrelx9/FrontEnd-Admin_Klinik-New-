import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import { createStaff, updateStaff } from "../../services/staffService";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "DOKTER", label: "Dokter" },
];

const EMPTY_FORM = { name: "", email: "", password: "", role: "DOKTER" };

export default function StaffFormModal({ open, onClose, staff, onSaved }) {
  const isEdit = Boolean(staff);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      staff
        ? { name: staff.name || "", email: staff.email || "", password: "", role: staff.role || "DOKTER" }
        : EMPTY_FORM
    );
    setErrors({});
    setSubmitError(null);
  }, [open, staff]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setSubmitError(null);

    if (!isEdit && form.password.length < 6) {
      setErrors({ password: ["Kata sandi minimal 6 karakter."] });
      setPending(false);
      return;
    }

    // On edit, an empty password field means "don't change it" — only
    // send it through if the admin actually typed a new one.
    const payload = { name: form.name, email: form.email, role: form.role };
    if (form.password) payload.password = form.password;

    try {
      const result = isEdit ? await updateStaff(staff.id, payload) : await createStaff(payload);
      onSaved(result.data);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setSubmitError(err.response?.data?.message || "Gagal menyimpan data staf.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Ubah Staf" : "Tambah Staf"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Lengkap" required error={errors.name?.[0]}>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Nama staf/dokter"
            className={inputClass(errors.name)}
          />
        </Field>

        <Field label="Email" required error={errors.email?.[0]}>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="staf@klinikgigi.com"
            className={inputClass(errors.email)}
          />
        </Field>

        <Field
          label={isEdit ? "Kata Sandi Baru" : "Kata Sandi"}
          required={!isEdit}
          error={errors.password?.[0]}
        >
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder={isEdit ? "Kosongkan kalau tidak diubah" : "Minimal 6 karakter"}
            className={inputClass(errors.password)}
          />
        </Field>

        <Field label="Peran" error={errors.role?.[0]}>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: opt.value }))}
                className={`rounded-lg border px-2.5 py-2 font-body text-xs font-semibold transition-colors ${
                  form.role === opt.value
                    ? "border-[var(--color-teal-700)] bg-[var(--color-teal-700)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
            {pending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Staf"}
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
