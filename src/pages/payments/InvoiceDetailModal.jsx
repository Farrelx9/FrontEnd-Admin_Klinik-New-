import { useState } from "react";
import { Plus, Trash2, Receipt } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/Modal";
import CurrencyInput from "../../components/CurrencyInput";
import ConfirmDialog from "../../components/ConfirmDialog";
import { addInvoicePayment, deleteInvoicePayment } from "../../services/invoiceService";
import { formatCurrency, formatDate } from "../../utils/format";

const METHOD_OPTIONS = [
  { value: "CASH", label: "Tunai" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "DEBIT", label: "Debit" },
  { value: "QRIS", label: "QRIS" },
];

const STATUS_META = {
  UNPAID: { label: "Belum Bayar", text: "text-[var(--color-coral)]", bg: "bg-[var(--color-coral-soft)]" },
  PARTIAL: { label: "DP / Sebagian", text: "text-[var(--color-gold)]", bg: "bg-[var(--color-gold-soft)]" },
  PAID: { label: "Lunas", text: "text-emerald-700", bg: "bg-emerald-50" },
};

function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function InvoiceDetailModal({ open, onClose, invoice, onUpdated, onEdit }) {
  const [addOpen, setAddOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [paidAt, setPaidAt] = useState(todayInput());
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [amountError, setAmountError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  if (!invoice) return null;
  const meta = STATUS_META[invoice.status] || STATUS_META.UNPAID;

  const resetAddForm = () => {
    setAmount("");
    setMethod("CASH");
    setPaidAt(todayInput());
    setNotes("");
    setAmountError(null);
  };

  const openAddForm = () => {
    // Sensible default: whatever's left, so "lunasi sisanya" is a
    // single click away, but staff can still change it for a partial
    // installment.
    setAmount(invoice.remainingAmount || "");
    setAddOpen(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (amount === "" || Number(amount) <= 0) {
      setAmountError("Nominal harus lebih dari 0.");
      return;
    }
    setPending(true);
    setAmountError(null);
    try {
      const result = await addInvoicePayment(invoice.id, {
        amount: Number(amount),
        method,
        paidAt,
        notes: notes || null,
      });
      onUpdated(result.data);
      toast.success("Pembayaran dicatat.");
      setAddOpen(false);
      resetAddForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mencatat pembayaran.");
    } finally {
      setPending(false);
    }
  };

  const confirmDeletePayment = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteInvoicePayment(deleteTarget.id);
      toast.success("Pembayaran dihapus, tagihan disesuaikan ulang.");
      // The list endpoint recomputes everything server-side; simplest
      // correct approach is to hand the caller the invoice id to refetch.
      onUpdated(null, invoice.id);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus pembayaran.");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Detail Tagihan" maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Summary */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[16px] font-bold text-[var(--color-ink)]">
                {invoice.patient?.name}
              </p>
              {invoice.medicalRecord && (
                <p className="mt-0.5 font-body text-xs text-[var(--color-muted)]">
                  Kunjungan {formatDate(invoice.medicalRecord.visitDate, { day: "2-digit", month: "short", year: "numeric" })}
                  {invoice.medicalRecord.diagnosis && ` · ${invoice.medicalRecord.diagnosis}`}
                </p>
              )}
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 font-body text-[12px] font-medium ${meta.bg} ${meta.text}`}>
              {meta.label}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl border border-[var(--color-border)] p-3.5">
            <SummaryFigure label="Total Tagihan" value={formatCurrency(invoice.totalAmount)} />
            <SummaryFigure label="Sudah Dibayar" value={formatCurrency(invoice.paidAmount)} accent="teal" />
            <SummaryFigure
              label="Sisa"
              value={formatCurrency(invoice.remainingAmount)}
              accent={invoice.remainingAmount > 0 ? "coral" : "teal"}
            />
          </div>

          {invoice.notes && (
            <p className="mt-2 font-body text-[13px] text-[var(--color-muted)]">{invoice.notes}</p>
          )}
        </div>

        {/* Payment history */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Riwayat Pembayaran
            </p>
            {invoice.remainingAmount > 0 && !addOpen && (
              <button
                type="button"
                onClick={openAddForm}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-teal-700)] px-3 py-1.5 font-body text-xs font-semibold text-white hover:bg-[var(--color-teal-600)]"
              >
                <Plus size={13} />
                Tambah Pembayaran
              </button>
            )}
          </div>

          {invoice.payments?.length > 0 ? (
            <ul className="mb-3 divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
              {invoice.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3.5 py-2.5">
                  <div>
                    <p className="font-body text-sm font-medium text-[var(--color-ink)]">
                      {formatCurrency(p.amount)}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--color-muted)]">
                      {formatDate(p.paidAt, { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
                      {METHOD_OPTIONS.find((m) => m.value === p.method)?.label || p.method}
                      {p.notes && ` · ${p.notes}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(p)}
                    className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)]"
                    aria-label="Hapus pembayaran ini"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !addOpen && (
              <div className="mb-3 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-8 text-center">
                <Receipt size={20} className="text-[var(--color-muted)]" />
                <p className="font-body text-sm text-[var(--color-muted)]">
                  Belum ada pembayaran tercatat.
                </p>
              </div>
            )
          )}

          {/* Inline add-payment form */}
          {addOpen && (
            <form
              onSubmit={handleAddPayment}
              className="space-y-3 rounded-xl border border-[var(--color-teal-500)]/40 bg-[var(--color-mint-200)]/15 p-3.5"
            >
              <div>
                <label className="mb-1 block font-body text-[12px] font-medium text-[var(--color-ink)]">
                  Nominal
                </label>
                <CurrencyInput value={amount} onChange={setAmount} error={amountError} />
                {amountError && (
                  <p className="mt-1 font-body text-xs text-[var(--color-coral)]">{amountError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-body text-[12px] font-medium text-[var(--color-ink)]">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-body text-[12px] font-medium text-[var(--color-ink)]">
                    Metode
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
                  >
                    {METHOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan (opsional)"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    resetAddForm();
                  }}
                  className="rounded-lg border border-[var(--color-border)] px-3.5 py-2 font-body text-xs font-semibold text-[var(--color-ink)] hover:bg-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-[var(--color-teal-700)] px-4 py-2 font-body text-xs font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:opacity-60"
                >
                  {pending ? "Menyimpan…" : "Simpan Pembayaran"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex justify-end border-t border-[var(--color-border)] pt-4">
          <button
            type="button"
            onClick={() => onEdit(invoice)}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 font-body text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
          >
            Ubah Total / Catatan Tagihan
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeletePayment}
        pending={deletePending}
        title="Hapus pembayaran ini?"
        description={
          deleteTarget
            ? `Pembayaran ${formatCurrency(deleteTarget.amount)} akan dihapus, dan status tagihan disesuaikan ulang otomatis.`
            : undefined
        }
      />
    </Modal>
  );
}

function SummaryFigure({ label, value, accent }) {
  const color =
    accent === "teal"
      ? "text-[var(--color-teal-700)]"
      : accent === "coral"
      ? "text-[var(--color-coral)]"
      : "text-[var(--color-ink)]";
  return (
    <div>
      <p className="font-body text-[10.5px] uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <p className={`mt-0.5 truncate font-mono text-[13px] font-bold ${color}`}>{value}</p>
    </div>
  );
}
