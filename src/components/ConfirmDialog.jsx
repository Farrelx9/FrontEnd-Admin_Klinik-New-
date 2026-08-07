import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Yakin ingin melanjutkan?",
  description,
  confirmLabel = "Hapus",
  pending = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title="" maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-coral-soft)] text-[var(--color-coral)]">
          <AlertTriangle size={22} />
        </span>
        <h3 className="mt-3 font-display text-[16px] font-bold text-[var(--color-ink)]">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 font-body text-sm text-[var(--color-muted)]">
            {description}
          </p>
        )}

        <div className="mt-6 flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2.5 font-body text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 rounded-lg bg-[var(--color-coral)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
