import { useEffect, useState } from "react";
import {
  Pencil,
  Phone,
  Mail,
  MapPin,
  Droplet,
  AlertCircle,
  Calendar,
  FileText,
} from "lucide-react";
import Modal from "../../components/Modal";
import { getPatient } from "../../services/patientService";

const GENDER_LABEL = { L: "Laki-laki", P: "Perempuan" };

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export default function PatientDetailModal({
  open,
  onClose,
  patientId,
  onEdit,
}) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !patientId) return;
    setLoading(true);
    setError(null);
    getPatient(patientId)
      .then((res) => setPatient(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Gagal memuat detail pasien."),
      )
      .finally(() => setLoading(false));
  }, [open, patientId]);

  const age = patient?.birthDate ? calculateAge(patient.birthDate) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Pasien"
      maxWidth="max-w-xl"
    >
      {loading ? (
        <DetailSkeleton />
      ) : error ? (
        <p className="py-8 text-center font-body text-sm text-[var(--color-coral)]">
          {error}
        </p>
      ) : patient ? (
        <div className="space-y-6">
          {/* Header identity block */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal-700)] font-display text-lg font-bold text-white">
                {patient.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-display text-[17px] font-bold text-[var(--color-ink)]">
                  {patient.name}
                </p>
                <p className="font-body text-[13px] text-[var(--color-muted)]">
                  {GENDER_LABEL[patient.gender] || "Jenis kelamin belum diisi"}
                  {age !== null && ` · ${age} tahun`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEdit(patient)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 font-body text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
            >
              <Pencil size={13} />
              Ubah
            </button>
          </div>

          {/* Contact & identity grid */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 rounded-xl border border-[var(--color-border)] p-4 sm:grid-cols-2">
            <InfoItem icon={Phone} label="Telepon" value={patient.phone} />
            <InfoItem icon={Mail} label="Email" value={patient.email} />
            <InfoItem
              icon={Calendar}
              label="Tanggal Lahir"
              value={formatDate(patient.birthDate)}
            />
            <InfoItem
              icon={Droplet}
              label="Golongan Darah"
              value={patient.bloodType}
            />
            <InfoItem
              icon={FileText}
              label="NIK"
              value={patient.nik}
              mono
              className="col-span-2"
            />
            <InfoItem
              icon={MapPin}
              label="Alamat"
              value={patient.address}
              className="col-span-2"
            />
            <InfoItem
              icon={AlertCircle}
              label="Alergi"
              value={patient.allergies}
              className="col-span-2"
              highlight={Boolean(patient.allergies)}
            />
          </div>

          {/* Recent medical records */}
          <div>
            <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Rekam Medis Terakhir
            </p>
            {patient.medicalRecords?.length ? (
              <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
                {patient.medicalRecords.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div>
                      <p className="font-body text-sm text-[var(--color-ink)]">
                        {r.diagnosis || r.complaint || "Kunjungan"}
                      </p>
                      <p className="font-mono text-[11px] text-[var(--color-muted)]">
                        {formatDate(r.visitDate)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-3 font-body text-sm text-[var(--color-muted)]">
                Belum ada rekam medis.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  mono,
  highlight,
  className = "",
}) {
  return (
    <div className={className}>
      <p className="mb-0.5 flex items-center gap-1.5 font-body text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        <Icon size={12} />
        {label}
      </p>
      <p
        className={`font-body text-[13.5px] ${mono ? "font-mono" : ""} ${
          highlight
            ? "font-medium text-[var(--color-coral)]"
            : "text-[var(--color-ink)]"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--color-mint-200)]/60" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-mint-200)]/60" />
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-mint-200)]/40" />
        </div>
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-[var(--color-mint-200)]/30" />
      <div className="h-16 animate-pulse rounded-xl bg-[var(--color-mint-200)]/30" />
    </div>
  );
}
