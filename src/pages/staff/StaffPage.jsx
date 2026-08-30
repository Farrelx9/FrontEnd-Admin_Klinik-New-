import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, UserCog, Shield, Stethoscope } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { getStaff, deleteStaff } from "../../services/staffService";
import { formatDate } from "../../utils/format";
import StaffFormModal from "./StaffFormModal";

const ROLE_META = {
  ADMIN: { label: "Admin", icon: Shield, text: "text-[var(--color-teal-700)]", bg: "bg-[var(--color-mint-200)]/60" },
  DOKTER: { label: "Dokter", icon: Stethoscope, text: "text-[var(--color-gold)]", bg: "bg-[var(--color-gold-soft)]" },
};

export default function StaffPage() {
  const { user: currentUser } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getStaff();
      setStaff(res.data);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Gagal memuat data staf. Cek koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [staff, search]);

  const openCreate = () => {
    setEditingStaff(null);
    setFormOpen(true);
  };

  const openEdit = (member) => {
    setEditingStaff(member);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    toast.success(editingStaff ? "Data staf diperbarui." : "Staf baru ditambahkan.");
    fetchStaff();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteStaff(deleteTarget.id);
      toast.success(`${deleteTarget.name} dihapus.`);
      setDeleteTarget(null);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus staf.");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Dokter & Staf"
        description="Kelola akun dokter dan staf klinik."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
          >
            <Plus size={16} />
            Tambah Staf
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
            placeholder="Cari nama atau email…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-9 pr-3.5 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)]"
          />
        </div>
        {!loading && !loadError && (
          <span className="hidden font-body text-xs text-[var(--color-muted)] sm:inline">
            {filtered.length} dari {staff.length} akun
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(22,41,42,0.04)]">
        {loading ? (
          <ListSkeleton />
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-body text-sm text-[var(--color-coral)]">{loadError}</p>
            <button
              onClick={fetchStaff}
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
                  <Th className="w-[28%]">Nama</Th>
                  <Th className="w-[30%]">Email</Th>
                  <Th className="w-[16%]">Peran</Th>
                  <Th className="w-[16%]">Bergabung</Th>
                  <Th className="w-[10%] text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const meta = ROLE_META[s.role] || ROLE_META.DOKTER;
                  const Icon = meta.icon;
                  const isSelf = s.id === currentUser?.id;
                  return (
                    <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]/60">
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal-700)] font-display text-xs font-bold text-white">
                            {s.name.charAt(0).toUpperCase()}
                          </span>
                          <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
                            {s.name}
                            {isSelf && <span className="ml-1.5 font-body text-xs text-[var(--color-muted)]">(Kamu)</span>}
                          </p>
                        </div>
                      </Td>
                      <Td>
                        <span className="truncate font-mono text-[13px] text-[var(--color-ink)]">{s.email}</span>
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-[12px] font-medium ${meta.bg} ${meta.text}`}>
                          <Icon size={12} />
                          {meta.label}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-body text-[13px] text-[var(--color-muted)]">
                          {formatDate(s.createdAt, { day: "2-digit", month: "short", year: "numeric" })}
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
                            onClick={() => !isSelf && setDeleteTarget(s)}
                            disabled={isSelf}
                            title={isSelf ? "Tidak bisa menghapus akun sendiri" : undefined}
                            className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--color-muted)]"
                            aria-label={`Hapus ${s.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Card list — mobile only */}
            <ul className="divide-y divide-[var(--color-border)] md:hidden">
              {filtered.map((s) => {
                const meta = ROLE_META[s.role] || ROLE_META.DOKTER;
                const Icon = meta.icon;
                const isSelf = s.id === currentUser?.id;
                return (
                  <li key={s.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal-700)] font-display text-xs font-bold text-white">
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-body text-sm font-semibold text-[var(--color-ink)]">
                          {s.name}
                          {isSelf && <span className="ml-1.5 font-body text-xs font-normal text-[var(--color-muted)]">(Kamu)</span>}
                        </p>
                        <p className="truncate font-mono text-xs text-[var(--color-muted)]">{s.email}</p>
                        <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-body text-[11px] font-medium ${meta.bg} ${meta.text}`}>
                          <Icon size={11} />
                          {meta.label}
                        </span>
                      </div>
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
                        onClick={() => !isSelf && setDeleteTarget(s)}
                        disabled={isSelf}
                        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)] disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Hapus ${s.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <StaffFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        staff={editingStaff}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        pending={deletePending}
        title="Hapus akun ini?"
        description={
          deleteTarget
            ? `Akun ${deleteTarget.name} (${deleteTarget.email}) akan dihapus permanen. Data yang sudah dikaitkan ke akun ini (misalnya sebagai dokter di jadwal/rekam medis lama) tidak ikut terhapus.`
            : undefined
        }
      />
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
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[var(--color-mint-200)]/60" />
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-mint-200)]/60" />
          <div className="hidden h-4 w-40 animate-pulse rounded bg-[var(--color-mint-200)]/40 sm:block" />
          <div className="ml-auto h-6 w-16 shrink-0 animate-pulse rounded-full bg-[var(--color-mint-200)]/40" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-mint-200)] text-[var(--color-teal-700)]">
        <UserCog size={22} />
      </span>
      <p className="mt-3 font-display text-[15px] font-semibold text-[var(--color-ink)]">
        {hasSearch ? "Tidak ada staf yang cocok" : "Belum ada staf terdaftar"}
      </p>
      <p className="mt-1 max-w-xs font-body text-sm text-[var(--color-muted)]">
        {hasSearch ? "Coba kata kunci lain." : "Mulai dengan menambahkan akun dokter atau staf pertama."}
      </p>
      {!hasSearch && (
        <button
          onClick={onAdd}
          className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
        >
          <Plus size={16} />
          Tambah Staf
        </button>
      )}
    </div>
  );
}
