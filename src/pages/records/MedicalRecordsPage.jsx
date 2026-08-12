import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import PatientPicker from "../../components/PatientPicker";
import {
  getMedicalRecords,
  deleteMedicalRecord,
} from "../../services/medicalRecordService";
import { formatCurrency, formatDate } from "../../utils/format";
import MedicalRecordFormModal from "./MedicalRecordFormModal";
import MedicalRecordDetailModal from "./MedicalRecordDetailModal";

const PAGE_SIZE = 10;

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [filterPatient, setFilterPatient] = useState(null);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getMedicalRecords({
        patientId: filterPatient?.id || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setRecords(res.data);
      setMeta(res.meta);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          "Gagal memuat rekam medis. Cek koneksi ke server.",
      );
    } finally {
      setLoading(false);
    }
  }, [filterPatient, page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    setPage(1);
  }, [filterPatient]);

  const openCreate = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setDetailOpen(false);
    setEditingRecord(record);
    setFormOpen(true);
  };

  const openDetail = (record) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    toast.success(
      editingRecord ? "Rekam medis diperbarui." : "Rekam medis ditambahkan.",
    );
    fetchRecords();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteMedicalRecord(deleteTarget.id);
      toast.success("Rekam medis dihapus.");
      setDeleteTarget(null);
      if (records.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchRecords();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Gagal menghapus rekam medis.",
      );
    } finally {
      setDeletePending(false);
    }
  };

  const recordTotal = (record) =>
    (record.services || []).reduce(
      (sum, s) => sum + Number(s.priceAtTime || 0),
      0,
    );

  return (
    <div>
      <PageHeader
        title="Rekam Medis"
        description="Riwayat pemeriksaan dan tindakan per pasien."
        actions={
          <>
            {filterPatient && (
              <Link
                to={`/rekam-medis/pasien/${filterPatient.id}/cetak`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2.5 font-body text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Cetak Riwayat Lengkap</span>
                <span className="sm:hidden">Cetak</span>
              </Link>
            )}
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
            >
              <Plus size={16} />
              Tambah Rekam Medis
            </button>
          </>
        }
      />

      <div className="mb-4 max-w-xs">
        <PatientPicker value={filterPatient} onChange={setFilterPatient} />
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(22,41,42,0.04)]">
        {loading ? (
          <ListSkeleton />
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-body text-sm text-[var(--color-coral)]">
              {loadError}
            </p>
            <button
              onClick={fetchRecords}
              className="mt-3 rounded-lg border border-[var(--color-border)] px-4 py-2 font-body text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
            >
              Coba lagi
            </button>
          </div>
        ) : records.length === 0 ? (
          <EmptyState hasFilter={Boolean(filterPatient)} onAdd={openCreate} />
        ) : (
          <>
            {/* Table — tablet and up */}
            <table className="hidden w-full table-fixed border-collapse text-left md:table">
              <thead>
                <tr className="border-b-2 border-[var(--color-border)] bg-[var(--color-bg)]">
                  <Th className="w-[18%]">Pasien</Th>
                  <Th className="w-[12%]">Tanggal</Th>
                  <Th className="w-[22%]">Diagnosis</Th>
                  <Th className="w-[22%]">Layanan</Th>
                  <Th className="w-[14%]">Total</Th>
                  <Th className="w-[12%] text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => openDetail(r)}
                    className="cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]/60"
                  >
                    <Td>
                      <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
                        {r.patient?.name}
                      </p>
                    </Td>
                    <Td>
                      <span className="font-mono text-[13px] text-[var(--color-ink)]">
                        {formatDate(r.visitDate, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </Td>
                    <Td>
                      <p className="truncate font-body text-[13px] text-[var(--color-ink)]">
                        {r.diagnosis || r.complaint || "—"}
                      </p>
                    </Td>
                    <Td>
                      <p className="truncate font-body text-[13px] text-[var(--color-muted)]">
                        {r.services?.length
                          ? r.services.map((s) => s.service?.name).join(", ")
                          : "—"}
                      </p>
                    </Td>
                    <Td>
                      <span className="font-mono text-[13px] text-[var(--color-ink)]">
                        {formatCurrency(recordTotal(r))}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div
                        className="flex justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/50 hover:text-[var(--color-teal-700)]"
                          aria-label="Ubah rekam medis"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(r)}
                          className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)]"
                          aria-label="Hapus rekam medis"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Card list — mobile only */}
            <ul className="divide-y divide-[var(--color-border)] md:hidden">
              {records.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(r)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left active:bg-[var(--color-bg)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-semibold text-[var(--color-ink)]">
                        {r.patient?.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-[var(--color-muted)]">
                        {formatDate(r.visitDate, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="mt-1 truncate font-body text-xs text-[var(--color-ink)]">
                        {r.diagnosis || r.complaint || "Tidak ada diagnosis"}
                      </p>
                      <p className="mt-1 font-mono text-xs font-semibold text-[var(--color-teal-700)]">
                        {formatCurrency(recordTotal(r))}
                      </p>
                    </div>
                    <div
                      className="flex shrink-0 items-center gap-0.5 pt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => openEdit(r)}
                        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/50 hover:text-[var(--color-teal-700)]"
                        aria-label="Ubah rekam medis"
                      >
                        <Pencil size={15} />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => setDeleteTarget(r)}
                        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)]"
                        aria-label="Hapus rekam medis"
                      >
                        <Trash2 size={15} />
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <Pagination meta={meta} page={page} onPageChange={setPage} />
          </>
        )}
      </div>

      <MedicalRecordFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        record={editingRecord}
        defaultPatient={filterPatient}
        onSaved={handleSaved}
      />

      <MedicalRecordDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        record={detailRecord}
        onEdit={openEdit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        pending={deletePending}
        title="Hapus rekam medis ini?"
        description="Data kunjungan dan layanan terkait akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
      />
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`border-r border-[var(--color-border)] px-5 py-3 font-body text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] last:border-r-0 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td
      className={`overflow-hidden border-r border-[var(--color-border)]/70 px-5 py-3.5 last:border-r-0 ${className}`}
    >
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
          <div className="hidden h-4 w-32 animate-pulse rounded bg-[var(--color-mint-200)]/40 md:block" />
          <div className="ml-auto h-4 w-16 shrink-0 animate-pulse rounded bg-[var(--color-mint-200)]/40" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilter, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-mint-200)] text-[var(--color-teal-700)]">
        <FileText size={22} />
      </span>
      <p className="mt-3 font-display text-[15px] font-semibold text-[var(--color-ink)]">
        {hasFilter
          ? "Belum ada rekam medis untuk pasien ini"
          : "Belum ada rekam medis"}
      </p>
      <p className="mt-1 max-w-xs font-body text-sm text-[var(--color-muted)]">
        {hasFilter
          ? "Tambahkan kunjungan pertama untuk pasien yang dipilih."
          : "Mulai dengan mencatat kunjungan pasien pertama."}
      </p>
      <button
        onClick={onAdd}
        className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
      >
        <Plus size={16} />
        Tambah Rekam Medis
      </button>
    </div>
  );
}

function Pagination({ meta, page, onPageChange }) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-3 sm:px-5">
      <p className="font-body text-xs text-[var(--color-muted)]">
        Halaman {meta.page} dari {meta.totalPages} · {meta.total} rekam medis
      </p>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40 disabled:opacity-40"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange((p) => Math.min(meta.totalPages, p + 1))}
          disabled={page >= meta.totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40 disabled:opacity-40"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
