import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Wallet, TrendingUp, ReceiptText, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import PatientPicker from "../../components/PatientPicker";
import { getInvoices, getInvoice, deleteInvoice } from "../../services/invoiceService";
import { formatCurrency, formatDate } from "../../utils/format";
import InvoiceFormModal from "./InvoiceFormModal";
import InvoiceDetailModal from "./InvoiceDetailModal";

const STATUS_META = {
  UNPAID: { label: "Belum Bayar", dot: "bg-[var(--color-coral)]", text: "text-[var(--color-coral)]", bg: "bg-[var(--color-coral-soft)]" },
  PARTIAL: { label: "DP / Sebagian", dot: "bg-[var(--color-gold)]", text: "text-[var(--color-gold)]", bg: "bg-[var(--color-gold-soft)]" },
  PAID: { label: "Lunas", dot: "bg-emerald-600", text: "text-emerald-700", bg: "bg-emerald-50" },
};

const STATUS_TABS = [
  { value: null, label: "Semua" },
  { value: "UNPAID", label: "Belum Bayar" },
  { value: "PARTIAL", label: "DP / Sebagian" },
  { value: "PAID", label: "Lunas" },
];

function isSameMonth(dateValue, ref) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [filterPatient, setFilterPatient] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getInvoices({ patientId: filterPatient?.id || undefined });
      setInvoices(res.data);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Gagal memuat tagihan. Cek koneksi ke server.");
    } finally {
      setLoading(false);
    }
  }, [filterPatient]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const visible = statusFilter ? invoices.filter((i) => i.status === statusFilter) : invoices;
  const counts = invoices.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const now = new Date();
  const totalOutstanding = invoices.reduce((sum, i) => sum + Number(i.remainingAmount || 0), 0);
  const collectedThisMonth = invoices.reduce((sum, i) => {
    const monthPayments = (i.payments || []).filter((p) => isSameMonth(p.paidAt, now));
    return sum + monthPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  }, 0);
  const activeCount = invoices.filter((i) => i.status !== "PAID").length;

  const openCreate = () => {
    setEditingInvoice(null);
    setFormOpen(true);
  };

  const openEdit = (invoice) => {
    setDetailOpen(false);
    setEditingInvoice(invoice);
    setFormOpen(true);
  };

  const openDetail = async (invoice) => {
    // Refetch full detail (includes ordered payment history) rather than
    // relying on the list row, which is enough for the table but not for
    // showing the installment timeline.
    try {
      const res = await getInvoice(invoice.id);
      setDetailInvoice(res.data);
      setDetailOpen(true);
    } catch (err) {
      toast.error("Gagal memuat detail tagihan.");
    }
  };

  const handleSaved = () => {
    setFormOpen(false);
    toast.success(editingInvoice ? "Tagihan diperbarui." : "Tagihan dibuat.");
    fetchInvoices();
  };

  // Called from InvoiceDetailModal after a payment is added/removed.
  // If `updatedInvoice` is given, use it directly (add-payment already
  // returns the fresh invoice); otherwise refetch by id (delete-payment
  // path, kept simple rather than duplicating the recompute logic here).
  const handleDetailUpdated = async (updatedInvoice, refetchId) => {
    const id = updatedInvoice?.id || refetchId;
    if (updatedInvoice) {
      setDetailInvoice(updatedInvoice);
    } else if (refetchId) {
      const res = await getInvoice(refetchId);
      setDetailInvoice(res.data);
    }
    fetchInvoices();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteInvoice(deleteTarget.id);
      toast.success("Tagihan dihapus.");
      setDeleteTarget(null);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus tagihan.");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pembayaran"
        description="Tagihan dan riwayat pembayaran pasien."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
          >
            <Plus size={16} />
            Buat Tagihan
          </button>
        }
      />

      {/* Summary strip */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={AlertCircle} accent="coral" label="Sisa Piutang" value={loading ? null : formatCurrency(totalOutstanding)} />
        <SummaryCard icon={TrendingUp} accent="mint" label="Diterima Bulan Ini" value={loading ? null : formatCurrency(collectedThisMonth)} />
        <SummaryCard icon={ReceiptText} accent="gold" label="Tagihan Aktif" value={loading ? null : String(activeCount)} />
      </div>

      <div className="mb-4 max-w-xs">
        <PatientPicker value={filterPatient} onChange={setFilterPatient} />
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.value;
          const count = tab.value ? counts[tab.value] || 0 : invoices.length;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-body text-[13px] font-medium transition-colors ${
                active
                  ? "border-[var(--color-teal-700)] bg-[var(--color-teal-700)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/30"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-white/20" : "bg-[var(--color-bg)]"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(22,41,42,0.04)]">
        {loading ? (
          <ListSkeleton />
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-body text-sm text-[var(--color-coral)]">{loadError}</p>
            <button onClick={fetchInvoices} className="mt-3 rounded-lg border border-[var(--color-border)] px-4 py-2 font-body text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40">
              Coba lagi
            </button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState hasFilter={Boolean(statusFilter || filterPatient)} onAdd={openCreate} />
        ) : (
          <>
            <table className="hidden w-full table-fixed border-collapse text-left md:table">
              <thead>
                <tr className="border-b-2 border-[var(--color-border)] bg-[var(--color-bg)]">
                  <Th className="w-[20%]">Pasien</Th>
                  <Th className="w-[20%]">Kunjungan</Th>
                  <Th className="w-[14%]">Total</Th>
                  <Th className="w-[14%]">Terbayar</Th>
                  <Th className="w-[14%]">Sisa</Th>
                  <Th className="w-[12%]">Status</Th>
                  <Th className="w-[6%] text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((inv) => {
                  const meta = STATUS_META[inv.status] || STATUS_META.UNPAID;
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => openDetail(inv)}
                      className="cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]/60"
                    >
                      <Td>
                        <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
                          {inv.patient?.name}
                        </p>
                      </Td>
                      <Td>
                        {inv.medicalRecord ? (
                          <p className="truncate font-body text-[13px] text-[var(--color-muted)]">
                            {formatDate(inv.medicalRecord.visitDate, { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        ) : (
                          <span className="font-body text-[13px] text-[var(--color-muted)]">—</span>
                        )}
                      </Td>
                      <Td>
                        <span className="font-mono text-[13px] text-[var(--color-ink)]">{formatCurrency(inv.totalAmount)}</span>
                      </Td>
                      <Td>
                        <span className="font-mono text-[13px] text-[var(--color-teal-700)]">{formatCurrency(inv.paidAmount)}</span>
                      </Td>
                      <Td>
                        <span className={`font-mono text-[13px] font-semibold ${inv.remainingAmount > 0 ? "text-[var(--color-coral)]" : "text-[var(--color-muted)]"}`}>
                          {formatCurrency(inv.remainingAmount)}
                        </span>
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-[12px] font-medium ${meta.bg} ${meta.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(inv);
                          }}
                          className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)]"
                          aria-label="Hapus tagihan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Card list — mobile only */}
            <ul className="divide-y divide-[var(--color-border)] md:hidden">
              {visible.map((inv) => {
                const meta = STATUS_META[inv.status] || STATUS_META.UNPAID;
                return (
                  <li key={inv.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(inv)}
                      className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left active:bg-[var(--color-bg)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body text-sm font-semibold text-[var(--color-ink)]">
                          {inv.patient?.name}
                        </p>
                        {inv.medicalRecord && (
                          <p className="mt-0.5 truncate font-body text-xs text-[var(--color-muted)]">
                            {formatDate(inv.medicalRecord.visitDate, { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-3 font-mono text-xs">
                          <span className="text-[var(--color-ink)]">{formatCurrency(inv.totalAmount)}</span>
                          {inv.remainingAmount > 0 && (
                            <span className="text-[var(--color-coral)]">Sisa {formatCurrency(inv.remainingAmount)}</span>
                          )}
                        </div>
                        <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-body text-[11px] font-medium ${meta.bg} ${meta.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(inv);
                        }}
                        className="shrink-0 rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)]"
                      >
                        <Trash2 size={15} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <InvoiceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        invoice={editingInvoice}
        defaultPatient={filterPatient}
        onSaved={handleSaved}
      />

      <InvoiceDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        invoice={detailInvoice}
        onUpdated={handleDetailUpdated}
        onEdit={openEdit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        pending={deletePending}
        title="Hapus tagihan ini?"
        description={
          deleteTarget
            ? `Tagihan ${formatCurrency(deleteTarget.totalAmount)} untuk ${deleteTarget.patient?.name} beserta seluruh riwayat pembayarannya akan dihapus permanen.`
            : undefined
        }
      />
    </div>
  );
}

function SummaryCard({ icon: Icon, accent, label, value }) {
  const ACCENT = {
    coral: "bg-[var(--color-coral-soft)] text-[var(--color-coral)]",
    mint: "bg-[var(--color-mint-200)] text-[var(--color-teal-700)]",
    gold: "bg-[var(--color-gold-soft)] text-[var(--color-gold)]",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ACCENT[accent]}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        {value === null ? (
          <span className="inline-block h-6 w-24 animate-pulse rounded bg-[var(--color-mint-200)]/50" />
        ) : (
          <p className="truncate font-display text-lg font-bold text-[var(--color-ink)]">{value}</p>
        )}
        <p className="truncate font-body text-xs text-[var(--color-muted)]">{label}</p>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`border-r border-[var(--color-border)] px-5 py-3 font-body text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] last:border-r-0 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`overflow-hidden border-r border-[var(--color-border)]/70 px-5 py-3.5 last:border-r-0 ${className}`}>
      {children}
    </td>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="h-4 w-28 shrink-0 animate-pulse rounded bg-[var(--color-mint-200)]/60 sm:w-40" />
          <div className="hidden h-4 w-24 animate-pulse rounded bg-[var(--color-mint-200)]/40 sm:block" />
          <div className="ml-auto h-6 w-20 shrink-0 animate-pulse rounded-full bg-[var(--color-mint-200)]/40" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilter, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-mint-200)] text-[var(--color-teal-700)]">
        <Wallet size={22} />
      </span>
      <p className="mt-3 font-display text-[15px] font-semibold text-[var(--color-ink)]">
        {hasFilter ? "Tidak ada tagihan yang cocok" : "Belum ada tagihan"}
      </p>
      <p className="mt-1 max-w-xs font-body text-sm text-[var(--color-muted)]">
        {hasFilter ? "Coba ubah filter, atau buat tagihan baru." : "Mulai dengan membuat tagihan pertama."}
      </p>
      <button onClick={onAdd} className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]">
        <Plus size={16} />
        Buat Tagihan
      </button>
    </div>
  );
}
