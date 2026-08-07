import { Pencil, Calendar, User, Stethoscope } from "lucide-react";
import Modal from "../../components/Modal";
import { formatCurrency, formatDate } from "../../utils/format";

export default function MedicalRecordDetailModal({ open, onClose, record, onEdit }) {
  if (!record) return null;

  const total = (record.services || []).reduce(
    (sum, s) => sum + Number(s.priceAtTime || 0),
    0
  );

  return (
    <Modal open={open} onClose={onClose} title="Detail Rekam Medis" maxWidth="max-w-xl">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal-700)] text-white">
              <User size={18} />
            </span>
            <div>
              <p className="font-display text-[16px] font-bold text-[var(--color-ink)]">
                {record.patient?.name}
              </p>
              <p className="flex items-center gap-1 font-body text-[13px] text-[var(--color-muted)]">
                <Calendar size={12} />
                {formatDate(record.visitDate)}
                {record.dokter?.name && ` · drg. ${record.dokter.name}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEdit(record)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 font-body text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
          >
            <Pencil size={13} />
            Ubah
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-[var(--color-border)] p-4 sm:grid-cols-2">
          <DetailField label="Keluhan" value={record.complaint} />
          <DetailField label="Diagnosis" value={record.diagnosis} />
          <DetailField label="Tindakan / Terapi" value={record.treatment} className="sm:col-span-2" />
          <DetailField label="Catatan" value={record.notes} className="sm:col-span-2" />
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 font-body text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            <Stethoscope size={12} />
            Layanan yang Dilakukan
          </p>
          {record.services?.length ? (
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <ul className="divide-y divide-[var(--color-border)]">
                {record.services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="font-body text-sm text-[var(--color-ink)]">
                        {s.service?.name}
                      </p>
                      {s.toothNumber && (
                        <p className="font-mono text-xs text-[var(--color-muted)]">
                          Gigi #{s.toothNumber}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-sm text-[var(--color-ink)]">
                      {formatCurrency(s.priceAtTime)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5">
                <span className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  Total
                </span>
                <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-3 font-body text-sm text-[var(--color-muted)]">
              Tidak ada layanan tercatat pada kunjungan ini.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function DetailField({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="mb-0.5 font-body text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </p>
      <p className="font-body text-[13.5px] text-[var(--color-ink)]">{value || "—"}</p>
    </div>
  );
}
