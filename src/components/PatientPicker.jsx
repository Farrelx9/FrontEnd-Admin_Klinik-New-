import { useEffect, useRef, useState } from "react";
import { Search, X, User } from "lucide-react";
import { getPatients } from "../services/patientService";
import useDebouncedValue from "../hooks/useDebouncedValue";

/**
 * Searchable patient combobox. `value` is the selected patient object
 * (or null); onChange receives the full patient object so callers have
 * the name/phone available without a second lookup.
 */
export default function PatientPicker({ value, onChange, error, disabled }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getPatients({ search: debouncedQuery || undefined, pageSize: 8 })
      .then((res) => setResults(res.data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery, open]);

  const handleSelect = (patient) => {
    onChange(patient);
    setOpen(false);
    setQuery("");
  };

  if (value) {
    return (
      <div
        className={`flex items-center justify-between rounded-lg border bg-[var(--color-surface)] px-3.5 py-2.5 ${
          error ? "border-[var(--color-coral)]" : "border-[var(--color-border)]"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal-700)] font-display text-xs font-bold text-white">
            {value.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
              {value.name}
            </p>
            {value.phone && (
              <p className="truncate font-mono text-xs text-[var(--color-muted)]">{value.phone}</p>
            )}
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)]"
            aria-label="Ganti pasien"
          >
            <X size={15} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder="Cari nama atau telepon pasien…"
          className={`w-full rounded-lg border bg-[var(--color-surface)] py-2.5 pl-9 pr-3.5 font-body text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-teal-500)] disabled:opacity-60 ${
            error ? "border-[var(--color-coral)]" : "border-[var(--color-border)]"
          }`}
        />
      </div>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          {loading ? (
            <p className="px-3.5 py-3 font-body text-sm text-[var(--color-muted)]">Mencari…</p>
          ) : results.length === 0 ? (
            <p className="px-3.5 py-3 font-body text-sm text-[var(--color-muted)]">
              Tidak ada pasien ditemukan.
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[var(--color-bg)]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-mint-200)] text-[var(--color-teal-700)]">
                      <User size={13} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-medium text-[var(--color-ink)]">
                        {p.name}
                      </p>
                      <p className="truncate font-mono text-xs text-[var(--color-muted)]">
                        {p.phone || "Tanpa nomor telepon"}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
