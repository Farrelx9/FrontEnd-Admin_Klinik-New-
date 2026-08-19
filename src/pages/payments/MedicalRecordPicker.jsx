import { useEffect, useState } from "react";
import { getMedicalRecords } from "../../services/medicalRecordService";
import { formatCurrency, formatDate } from "../../utils/format";

function recordTotal(record) {
  return (record.services || []).reduce((sum, s) => sum + Number(s.priceAtTime || 0), 0);
}

/**
 * Dropdown of a specific patient's visits, so a payment can (optionally)
 * be linked to the medical record that generated the charge. Selecting
 * one hands the parent both the id and its computed total, so the form
 * can offer to prefill the amount field.
 */
export default function MedicalRecordPicker({ patientId, value, onChange }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setRecords([]);
      return;
    }
    setLoading(true);
    getMedicalRecords({ patientId, pageSize: 100 })
      .then((res) => setRecords(res.data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  const handleChange = (e) => {
    const id = e.target.value || null;
    const record = records.find((r) => r.id === id) || null;
    onChange(id, record ? recordTotal(record) : null);
  };

  return (
    <select
      value={value || ""}
      onChange={handleChange}
      disabled={!patientId || loading}
      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 font-body text-sm text-[var(--color-ink)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--color-teal-500)] disabled:opacity-60"
    >
      <option value="">
        {!patientId
          ? "Pilih pasien dulu"
          : loading
          ? "Memuat riwayat kunjungan…"
          : records.length === 0
          ? "Pasien ini belum punya rekam medis"
          : "— Tanpa rekam medis terkait —"}
      </option>
      {records.map((r) => (
        <option key={r.id} value={r.id}>
          {formatDate(r.visitDate, { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
          {r.diagnosis || r.complaint || "Kunjungan"} · {formatCurrency(recordTotal(r))}
        </option>
      ))}
    </select>
  );
}
