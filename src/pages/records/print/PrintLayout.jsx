import { Printer, FileText } from "lucide-react";
import LogoMark from "../../../components/Logo";
import { formatCurrency, formatDate } from "../../../utils/format";

// Just the print action — hidden automatically when printing via
// Tailwind's `print:hidden`, so it never shows up in the PDF/paper output.
//
// No "back" button here on purpose: this page always opens in a fresh
// tab (target="_blank" + rel="noopener" from wherever it's linked), so
// there's no in-app route to go back to, and `window.close()` isn't
// reliably callable on a noopener tab either. Closing the tab is the
// natural way out — same pattern as Google Drive/Dropbox file previews.
export function PrintToolbar() {
  return (
    <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="font-body text-xs text-[var(--color-muted)]">
        Tutup tab ini setelah selesai mencetak.
      </p>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] sm:py-2"
      >
        <Printer size={16} />
        Cetak / Simpan PDF
      </button>
    </div>
  );
}

export function ClinicLetterhead() {
  return (
    <div className="mb-6">
      <div className="mb-4 h-1.5 w-full rounded-full bg-gradient-to-r from-[var(--color-teal-700)] via-[var(--color-teal-500)] to-[var(--color-mint-400)] print:rounded-none" />
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[var(--color-ink)] pb-4">
        <div className="flex items-center gap-3">
          <LogoMark className="h-11 w-11 shrink-0" />
          <div>
            <p className="font-display text-xl font-bold leading-tight text-[var(--color-ink)]">
              Klinik Senyum
            </p>
            <p className="font-body text-xs text-[var(--color-muted)]">
              Praktik Dokter Gigi Umum
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-teal-700)] px-3 py-1.5 text-white">
          <FileText size={13} />
          <span className="font-body text-[11px] font-semibold uppercase tracking-wider">
            Rekam Medis
          </span>
        </div>
      </div>
    </div>
  );
}

const GENDER_LABEL = { L: "Laki-laki", P: "Perempuan" };

export function PatientInfoBlock({ patient }) {
  if (!patient) return null;
  return (
    <div className="mb-6 break-inside-avoid-page rounded-lg border-l-4 border-[var(--color-teal-700)] bg-[var(--color-mint-200)]/20 p-4 print:bg-transparent">
      <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-wider text-[var(--color-teal-700)]">
        Data Pasien
      </p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 font-body text-[13px] sm:grid-cols-2 print:grid-cols-2">
        <InfoRow label="Nama Pasien" value={patient.name} />
        <InfoRow label="No. Rekam Medis" value={patient.id?.slice(0, 8).toUpperCase()} mono />
        <InfoRow label="Tanggal Lahir" value={formatDate(patient.birthDate)} />
        <InfoRow label="Jenis Kelamin" value={GENDER_LABEL[patient.gender] || "—"} />
        <InfoRow label="NIK" value={patient.nik || "—"} mono />
        <InfoRow label="Telepon" value={patient.phone || "—"} />
        <InfoRow label="Alamat" value={patient.address || "—"} className="sm:col-span-2" />
        {patient.allergies && (
          <InfoRow
            label="Alergi"
            value={patient.allergies}
            className="sm:col-span-2"
            highlight
          />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight, className = "" }) {
  return (
    <div className={`flex flex-col gap-0.5 sm:flex-row sm:gap-2 ${className}`}>
      <span className="shrink-0 text-[var(--color-muted)] sm:w-32">{label}</span>
      <span
        className={`min-w-0 break-words ${mono ? "font-mono" : ""} ${
          highlight
            ? "font-semibold text-[var(--color-coral)]"
            : "text-[var(--color-ink)]"
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

// One visit's worth of clinical content — reused for both the single
// record printout and the bundled full-history printout.
export function VisitSection({ record, index, showPatientHeading = false }) {
  const total = (record.services || []).reduce(
    (sum, s) => sum + Number(s.priceAtTime || 0),
    0
  );

  return (
    <div className="break-inside-avoid-page mb-5 overflow-hidden rounded-lg border border-[var(--color-border)] shadow-[0_1px_2px_rgba(22,41,42,0.04)] print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--color-teal-700)] px-4 py-2.5 print:bg-[var(--color-teal-700)]">
        <div className="flex items-center gap-2">
          {typeof index === "number" && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 font-mono text-[10px] font-bold text-white">
              {index + 1}
            </span>
          )}
          <p className="font-body text-[13px] font-semibold text-white">
            Kunjungan {formatDate(record.visitDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {record.dokter?.name && (
            <p className="font-body text-[11px] text-white/80">drg. {record.dokter.name}</p>
          )}
          {showPatientHeading && record.patient?.name && (
            <p className="font-body text-[11px] text-white/80">· {record.patient.name}</p>
          )}
        </div>
      </div>

      <div className="p-4">
        <dl className="mb-3 space-y-1.5 font-body text-[13px]">
          <DetailLine label="Keluhan" value={record.complaint} />
          <DetailLine label="Diagnosis" value={record.diagnosis} />
          <DetailLine label="Tindakan / Terapi" value={record.treatment} />
          <DetailLine label="Catatan" value={record.notes} />
        </dl>

        {record.services?.length > 0 && (
          <div className="overflow-hidden rounded-md border border-[var(--color-border)]">
            <table className="w-full border-collapse font-body text-[12.5px]">
              <thead>
                <tr className="bg-[var(--color-bg)] text-left text-[var(--color-muted)] print:bg-[var(--color-bg)]">
                  <th className="px-2.5 py-1.5 font-medium">Layanan</th>
                  <th className="px-2.5 py-1.5 font-medium">Gigi</th>
                  <th className="px-2.5 py-1.5 text-right font-medium">Harga</th>
                </tr>
              </thead>
              <tbody>
                {record.services.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--color-border)]">
                    <td className="px-2.5 py-1.5">{s.service?.name}</td>
                    <td className="px-2.5 py-1.5 font-mono">{s.toothNumber || "—"}</td>
                    <td className="px-2.5 py-1.5 text-right font-mono">
                      {formatCurrency(s.priceAtTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--color-border)] bg-[var(--color-mint-200)]/30 print:bg-[var(--color-mint-200)]/30">
                  <td colSpan={2} className="px-2.5 py-1.5 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono font-bold text-[var(--color-teal-700)]">
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailLine({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="shrink-0 text-[var(--color-muted)] sm:w-32">{label}</dt>
      <dd className="min-w-0 break-words text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}

export function SignatureBlock() {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="mt-10 flex flex-col items-end gap-6 break-inside-avoid-page sm:flex-row sm:items-start sm:justify-between">
      <p className="font-body text-[11px] text-[var(--color-muted)]">
        Dokumen ini dicetak elektronik melalui sistem Klinik Senyum pada {today}.
      </p>
      <div className="text-center font-body text-[13px]">
        <p className="text-[var(--color-muted)]">Hormat kami,</p>
        <div className="mt-16 w-44 border-t border-[var(--color-ink)] pt-1">
          <p className="font-medium text-[var(--color-ink)]">Dokter Pemeriksa</p>
        </div>
      </div>
    </div>
  );
}
