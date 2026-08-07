import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { getPatients, deletePatient } from "../../services/patientService";
import PatientFormModal from "./PatientFormModal";
import PatientDetailModal from "./PatientDetailModal";

const PAGE_SIZE = 10;

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPatientId, setDetailPatientId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getPatients({
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setPatients(res.data);
      setMeta(res.meta);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          "Gagal memuat data pasien. Cek koneksi ke server.",
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Reset to page 1 whenever the search term changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const openCreate = () => {
    setEditingPatient(null);
    setFormOpen(true);
  };

  const openEdit = (patient) => {
    setEditingPatient(patient);
    setFormOpen(true);
  };

  const openDetail = (patient) => {
    setDetailPatientId(patient.id);
    setDetailOpen(true);
  };

  const handleEditFromDetail = (patient) => {
    setDetailOpen(false);
    openEdit(patient);
  };

  const handleSaved = () => {
    setFormOpen(false);
    toast.success(
      editingPatient ? "Data pasien diperbarui." : "Pasien baru ditambahkan.",
    );
    fetchPatients();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deletePatient(deleteTarget.id);
      toast.success(`${deleteTarget.name} dihapus.`);
      setDeleteTarget(null);
      // If we deleted the last item on this page, step back a page.
      if (patients.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchPatients();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus pasien.");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pasien"
        description="Daftar dan data pasien klinik."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
          >
            <Plus size={16} />
            Tambah Pasien
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, telepon, atau NIK…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-9 pr-3.5 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(22,41,42,0.04)]">
        {loading ? (
          <TableSkeleton />
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-body text-sm text-[var(--color-coral)]">
              {loadError}
            </p>
            <button
              onClick={fetchPatients}
              className="mt-3 rounded-lg border border-[var(--color-border)] px-4 py-2 font-body text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
            >
              Coba lagi
            </button>
          </div>
        ) : patients.length === 0 ? (
          <EmptyState hasSearch={Boolean(debouncedSearch)} onAdd={openCreate} />
        ) : (
          <>
            {/* Table — tablet and up, where there's room for every column */}
            <table className="hidden w-full table-fixed border-collapse text-left md:table">
              <thead>
                <tr className="border-b-2  border-[var(--color-border)] bg-[var(--color-bg)]">
                  <Th className="w-[17%]">Nama</Th>
                  <Th className="w-[12%]">Telepon</Th>
                  <Th className="w-[14%]">NIK</Th>
                  <Th className="w-[21%]">Alamat</Th>
                  <Th className="w-[16%]">Alergi</Th>
                  <Th className="w-[9%]">Kelamin</Th>
                  <Th className="w-[100px] lg:w-[145px] text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => openDetail(p)}
                    className="cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]/60"
                  >
                    <Td>
                      <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
                        {p.name}
                      </p>
                      {p.email && (
                        <p className="truncate font-body text-xs text-[var(--color-muted)]">
                          {p.email}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <span
                        className="block truncate font-mono text-[13px] text-[var(--color-ink)]"
                        title={p.phone || ""}
                      >
                        {p.phone || "—"}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className="block truncate font-mono text-[13px] text-[var(--color-ink)]"
                        title={p.nik || ""}
                      >
                        {p.nik || "—"}
                      </span>
                    </Td>
                    <Td>
                      <p
                        className="truncate font-body text-[13px] text-[var(--color-ink)]"
                        title={p.address || ""}
                      >
                        {p.address || "—"}
                      </p>
                    </Td>
                    <Td>
                      {p.allergies ? (
                        <span
                          className="inline-block max-w-full truncate rounded-md bg-[var(--color-coral-soft)] px-2 py-0.5 font-body text-[12px] font-medium text-[var(--color-coral)]"
                          title={p.allergies}
                        >
                          {p.allergies}
                        </span>
                      ) : (
                        <span className="font-body text-[13px] text-[var(--color-muted)]">
                          —
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="block truncate font-body text-[13px] text-[var(--color-ink)]">
                        {p.gender === "L"
                          ? "Laki-laki"
                          : p.gender === "P"
                            ? "Perempuan"
                            : "—"}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div
                        className="flex justify-end gap-0.5 lg:gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openDetail(p)}
                          className="hidden rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/50 hover:text-[var(--color-teal-700)] lg:inline-flex lg:p-2"
                          aria-label={`Lihat detail ${p.name}`}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/50 hover:text-[var(--color-teal-700)] lg:p-2"
                          aria-label={`Ubah ${p.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)] lg:p-2"
                          aria-label={`Hapus ${p.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Card list — mobile only, one patient per row instead of
                cramming every column into a screen that's too narrow. */}
            <ul className="divide-y divide-[var(--color-border)] md:hidden">
              {patients.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(p)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left active:bg-[var(--color-bg)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-semibold text-[var(--color-ink)]">
                        {p.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-[var(--color-muted)]">
                        {p.phone || "Tanpa nomor telepon"}
                      </p>
                      {p.address && (
                        <p className="mt-1 truncate font-body text-xs text-[var(--color-muted)]">
                          {p.address}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-[var(--color-mint-200)]/50 px-1.5 py-0.5 font-body text-[11px] font-medium text-[var(--color-teal-700)]">
                          {p.gender === "L"
                            ? "Laki-laki"
                            : p.gender === "P"
                              ? "Perempuan"
                              : "Kelamin —"}
                        </span>
                        {p.allergies && (
                          <span className="max-w-[9rem] truncate rounded-md bg-[var(--color-coral-soft)] px-1.5 py-0.5 font-body text-[11px] font-medium text-[var(--color-coral)]">
                            {p.allergies}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex shrink-0 items-center gap-0.5 pt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/50 hover:text-[var(--color-teal-700)]"
                        aria-label={`Ubah ${p.name}`}
                      >
                        <Pencil size={15} />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => setDeleteTarget(p)}
                        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)]"
                        aria-label={`Hapus ${p.name}`}
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

      <PatientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        patient={editingPatient}
        onSaved={handleSaved}
      />

      <PatientDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        patientId={detailPatientId}
        onEdit={handleEditFromDetail}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        pending={deletePending}
        title="Hapus data pasien ini?"
        description={
          deleteTarget
            ? `${deleteTarget.name} beserta riwayat terkait akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`
            : undefined
        }
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

function TableSkeleton() {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="h-4 w-28 shrink-0 animate-pulse rounded bg-[var(--color-mint-200)]/60 sm:w-40" />
          <div className="hidden h-4 w-28 animate-pulse rounded bg-[var(--color-mint-200)]/40 sm:block" />
          <div className="hidden h-4 w-32 animate-pulse rounded bg-[var(--color-mint-200)]/40 md:block" />
          <div className="ml-auto h-4 w-14 shrink-0 animate-pulse rounded bg-[var(--color-mint-200)]/40" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-mint-200)] text-[var(--color-teal-700)]">
        <Users size={22} />
      </span>
      <p className="mt-3 font-display text-[15px] font-semibold text-[var(--color-ink)]">
        {hasSearch ? "Tidak ada pasien yang cocok" : "Belum ada pasien"}
      </p>
      <p className="mt-1 max-w-xs font-body text-sm text-[var(--color-muted)]">
        {hasSearch
          ? "Coba kata kunci lain, atau tambahkan sebagai pasien baru."
          : "Mulai dengan menambahkan data pasien pertama."}
      </p>
      {!hasSearch && (
        <button
          onClick={onAdd}
          className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
        >
          <Plus size={16} />
          Tambah Pasien
        </button>
      )}
    </div>
  );
}

function Pagination({ meta, page, onPageChange }) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-3 sm:px-5">
      <p className="font-body text-xs text-[var(--color-muted)]">
        Halaman {meta.page} dari {meta.totalPages} · {meta.total} pasien
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
