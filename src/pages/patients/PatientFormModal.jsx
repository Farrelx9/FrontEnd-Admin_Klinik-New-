import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import { createPatient, updatePatient } from "../../services/patientService";

const EMPTY_FORM = {
  name: "",
  nik: "",
  phone: "",
  email: "",
  address: "",
  birthDate: "",
  gender: "",
  bloodType: "",
  allergies: "",
};

// `patient` is null for "create" mode, or an existing patient object for
// "edit" mode. onSaved is called with the saved record so the list can
// update without a full refetch.
export default function PatientFormModal({ open, onClose, patient, onSaved }) {
  const isEdit = Boolean(patient);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (patient) {
      setForm({
        name: patient.name || "",
        nik: patient.nik || "",
        phone: patient.phone || "",
        email: patient.email || "",
        address: patient.address || "",
        birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : "",
        gender: patient.gender || "",
        bloodType: patient.bloodType || "",
        allergies: patient.allergies || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setSubmitError(null);
  }, [open, patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setSubmitError(null);

    // Send empty optional strings as null so they don't fail backend
    // validators (e.g. an empty email string fails z.string().email()).
    const payload = {
      ...form,
      nik: form.nik || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      birthDate: form.birthDate || null,
      gender: form.gender || null,
      bloodType: form.bloodType || null,
      allergies: form.allergies || null,
    };

    try {
      const result = isEdit
        ? await updatePatient(patient.id, payload)
        : await createPatient(payload);
      onSaved(result.data);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setSubmitError(
          err.response?.data?.message || "Gagal menyimpan data pasien.",
        );
      }
    } finally {
      setPending(false);
    }
  };

  const fieldError = (name) => errors[name]?.[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Ubah Data Pasien" : "Tambah Pasien"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Lengkap" required error={fieldError("name")}>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass(fieldError("name"))}
            placeholder="Nama pasien"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="NIK" error={fieldError("nik")}>
            <input
              name="nik"
              value={form.nik}
              onChange={handleChange}
              maxLength={16}
              className={inputClass(fieldError("nik"))}
              placeholder="16 digit"
            />
          </Field>
          <Field label="No. Telepon" required error={fieldError("phone")}>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputClass(fieldError("phone"))}
              placeholder="08xxxxxxxxxx"
            />
          </Field>
        </div>

        <Field label="Email" error={fieldError("email")}>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={inputClass(fieldError("email"))}
            placeholder="pasien@email.com"
          />
        </Field>

        <Field label="Alamat" required error={fieldError("address")}>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            className={inputClass(fieldError("address"))}
            placeholder="Alamat lengkap"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Tgl Lahir" required error={fieldError("birthDate")}>
            <input
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
              className={inputClass(fieldError("birthDate"))}
            />
          </Field>
          <Field label="Jenis Kelamin" required error={fieldError("gender")}>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={inputClass(fieldError("gender"))}
            >
              <option value="">—</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </Field>
          <Field label="Gol. Darah" error={fieldError("bloodType")}>
            <input
              name="bloodType"
              value={form.bloodType}
              onChange={handleChange}
              className={inputClass(fieldError("bloodType"))}
              placeholder="A/B/AB/O"
            />
          </Field>
        </div>

        <Field label="Alergi" error={fieldError("allergies")}>
          <textarea
            name="allergies"
            value={form.allergies}
            onChange={handleChange}
            rows={2}
            className={inputClass(fieldError("allergies"))}
            placeholder="Alergi obat/bahan tertentu, kalau ada"
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
                : "Tambah Pasien"}
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
