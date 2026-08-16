import { useEffect, useState } from "react";
import { getStaff } from "../services/staffService";

/**
 * Plain <select> of staff with role DOKTER. Unlike PatientPicker, a
 * simple dropdown is the right call here — clinics typically have a
 * handful of dentists, not hundreds, so a searchable combobox would be
 * over-engineering for the actual list size.
 */
export default function DoctorSelect({
  value,
  onChange,
  error,
  className = "",
}) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStaff()
      .then((res) => setDoctors(res.data.filter((s) => s.role === "DOKTER")))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={loading}
      className={`w-full rounded-lg border bg-[var(--color-surface)] px-3.5 py-2.5 font-body text-sm text-[var(--color-ink)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--color-teal-500)] disabled:opacity-60 ${
        error ? "border-[var(--color-coral)]" : "border-[var(--color-border)]"
      } ${className}`}
    >
      <option value="">
        {loading
          ? "Memuat dokter…"
          : doctors.length === 0
            ? "Belum ada data dokter"
            : "— Belum ditentukan —"}
      </option>
      {doctors.map((d) => (
        <option key={d.id} value={d.id}>
          drg. {d.name}
        </option>
      ))}
    </select>
  );
}
