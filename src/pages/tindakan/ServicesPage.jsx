import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Stethoscope } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import { getServices, deleteService } from "../../services/serviceService";
import { formatCurrency } from "../../utils/format";
import ServiceFormModal from "./ServiceFormModal";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getServices();
      setServices(res.data);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          "Gagal memuat data layanan. Cek koneksi ke server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Client-side filter — the catalog is small (~40 items), no need to
  // round-trip to the server just to search it.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
    );
  }, [services, search]);

  const openCreate = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const openEdit = (service) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    toast.success(
      editingService ? "Layanan diperbarui." : "Layanan baru ditambahkan."
    );
    fetchServices();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteService(deleteTarget.id);
      toast.success(`${deleteTarget.name} dihapus.`);
      setDeleteTarget(null);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus layanan.");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Layanan & Tindakan"
        description="Daftar layanan, tindakan, dan tarif klinik."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
          >
            <Plus size={16} />
            Tambah Layanan
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
            placeholder="Cari nama layanan…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-9 pr-3.5 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
          />
        </div>
        {!loading && !loadError && (
          <span className="hidden font-body text-xs text-[var(--color-muted)] sm:inline">
            {filtered.length} dari {services.length} layanan
          </span>
        )}
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
              onClick={fetchServices}
              className="mt-3 rounded-lg border border-[var(--color-border)] px-4 py-2 font-body text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
            >
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={Boolean(search)} onAdd={openCreate} />
        ) : (
          <>
            {/* Table — tablet and up */}
            <table className="hidden w-full table-fixed border-collapse text-left md:table">
              <thead>
                <tr className="border-b-2 border-[var(--color-border)] bg-[var(--color-bg)]">
                  <Th className="w-[36%]">Nama Layanan</Th>
                  <Th className="w-[44%]">Deskripsi</Th>
                  <Th className="w-[12%]">Harga</Th>
                  <Th className="w-[8%] text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]/60"
                  >
                    <Td>
                      <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
                        {s.name}
                      </p>
                    </Td>
                    <Td>
                      <p
                        className="truncate font-body text-[13px] text-[var(--color-muted)]"
                        title={s.description || ""}
                      >
                        {s.description || "—"}
                      </p>
                    </Td>
                    <Td>
                      <span className="font-mono text-[13px] font-medium text-[var(--color-ink)]">
                        {formatCurrency(s.price)}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/50 hover:text-[var(--color-teal-700)]"
                          aria-label={`Ubah ${s.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)]"
                          aria-label={`Hapus ${s.name}`}
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
              {filtered.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-3 px-4 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-semibold text-[var(--color-ink)]">
                      {s.name}
                    </p>
                    {s.description && (
                      <p className="mt-0.5 truncate font-body text-xs text-[var(--color-muted)]">
                        {s.description}
                      </p>
                    )}
                    <p className="mt-1 font-mono text-xs font-semibold text-[var(--color-teal-700)]">
                      {formatCurrency(s.price)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/50 hover:text-[var(--color-teal-700)]"
                      aria-label={`Ubah ${s.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(s)}
                      className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)]"
                      aria-label={`Hapus ${s.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ServiceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        service={editingService}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        pending={deletePending}
        title="Hapus layanan ini?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" akan dihapus dari katalog. Rekam medis lama yang sudah memakai layanan ini tidak akan terpengaruh (harga sudah tersimpan di riwayat masing-masing).`
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

function ListSkeleton() {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="h-4 w-32 shrink-0 animate-pulse rounded bg-[var(--color-mint-200)]/60 sm:w-48" />
          <div className="hidden h-4 w-40 animate-pulse rounded bg-[var(--color-mint-200)]/40 md:block" />
          <div className="ml-auto h-4 w-16 shrink-0 animate-pulse rounded bg-[var(--color-mint-200)]/40" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-mint-200)] text-[var(--color-teal-700)]">
        <Stethoscope size={22} />
      </span>
      <p className="mt-3 font-display text-[15px] font-semibold text-[var(--color-ink)]">
        {hasSearch ? "Tidak ada layanan yang cocok" : "Belum ada layanan"}
      </p>
      <p className="mt-1 max-w-xs font-body text-sm text-[var(--color-muted)]">
        {hasSearch
          ? "Coba kata kunci lain, atau tambahkan sebagai layanan baru."
          : "Mulai dengan menambahkan layanan pertama."}
      </p>
      {!hasSearch && (
        <button
          onClick={onAdd}
          className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
        >
          <Plus size={16} />
          Tambah Layanan
        </button>
      )}
    </div>
  );
}
