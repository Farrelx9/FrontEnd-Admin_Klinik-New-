import { useEffect, useState } from "react";
import { X, Check, Baby } from "lucide-react";

// FDI two-digit tooth notation, laid out the way a dentist's chart is
// conventionally drawn: patient's right on the viewer's left, upper arch
// on top, lower arch on bottom, each split into two quadrants by a
// center gap.
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

// Gigi susu / desidui (FDI notation, quadrants 5-8) — sits between the
// permanent rows on a standard odontogram. Shown only when toggled on,
// since most patients are adults with permanent teeth only.
const PRIMARY_UPPER_RIGHT = [55, 54, 53, 52, 51];
const PRIMARY_UPPER_LEFT = [61, 62, 63, 64, 65];
const PRIMARY_LOWER_RIGHT = [85, 84, 83, 82, 81];
const PRIMARY_LOWER_LEFT = [71, 72, 73, 74, 75];

function parseValue(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Visual tooth picker using FDI notation. `value` is a comma-separated
 * string of tooth numbers (e.g. "16,26"), matching what's stored in
 * `toothNumber` on the backend — this component is just a nicer way to
 * produce that same string, no schema change needed.
 */
const ALL_PRIMARY = [
  ...PRIMARY_UPPER_RIGHT,
  ...PRIMARY_UPPER_LEFT,
  ...PRIMARY_LOWER_RIGHT,
  ...PRIMARY_LOWER_LEFT,
].map(String);

export default function ToothChartPicker({
  open,
  onClose,
  value,
  onConfirm,
  serviceName,
}) {
  const [selected, setSelected] = useState(parseValue(value));
  const [showPrimary, setShowPrimary] = useState(false);

  useEffect(() => {
    if (!open) return;
    const parsed = parseValue(value);
    setSelected(parsed);
    // If we're editing a selection that already has a gigi susu in it,
    // reveal the primary rows automatically instead of hiding a tooth
    // that's already chosen.
    setShowPrimary(parsed.some((n) => ALL_PRIMARY.includes(n)));
  }, [open, value]);

  if (!open) return null;

  const toggleTooth = (num) => {
    setSelected((prev) =>
      prev.includes(String(num))
        ? prev.filter((n) => n !== String(num))
        : [...prev, String(num)],
    );
  };

  const handleConfirm = () => {
    onConfirm(selected.join(","));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h3 className="font-display text-[15px] font-bold text-[var(--color-ink)]">
              Pilih Gigi
            </h3>
            {serviceName && (
              <p className="mt-0.5 font-body text-xs text-[var(--color-muted)]">
                {serviceName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-mint-200)]/50 hover:text-[var(--color-ink)]"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {/* Toggle for gigi susu — off by default since most patients
              are adults; the primary rows only take up space when needed. */}
          <label className="mb-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--color-mint-400)]/40 bg-[var(--color-mint-200)]/35 px-3.5 py-2.5">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal-700)] text-white">
                <Baby size={14} />
              </span>
              <span className="font-body text-[13px] font-medium text-[var(--color-teal-900)]">
                Sertakan gigi susu (pasien anak)
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showPrimary}
              onClick={() => setShowPrimary((v) => !v)}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                showPrimary ? "bg-[var(--color-teal-700)]" : "bg-white"
              }`}
            >
              <span
                className={`absolute left-0 top-0.5 h-4 w-4 rounded-full shadow transition-transform ${
                  showPrimary
                    ? "translate-x-[18px] bg-white"
                    : "translate-x-0.5 bg-[var(--color-muted)]"
                }`}
              />
            </button>
          </label>

          {showPrimary && (
            <div className="mb-3 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1.5 font-body text-[11px] text-[var(--color-muted)]">
                <span className="h-2.5 w-2.5 rounded-sm border border-[var(--color-border)] bg-[var(--color-bg)]" />
                Permanen
              </span>
              <span className="flex items-center gap-1.5 font-body text-[11px] text-[var(--color-muted)]">
                <span className="h-2.5 w-2.5 rounded-sm border border-[var(--color-gold)]/50 bg-[var(--color-gold-soft)]" />
                Gigi susu
              </span>
            </div>
          )}

          {/* On narrow screens 16 teeth across is wider than the modal,
              so the whole chart scrolls horizontally as one unit — every
              row stays aligned while scrolling together. */}
          <div className="-mx-5 overflow-x-auto px-5">
            <div className="mx-auto w-max min-w-full">
              {/* Permanent upper arch */}
              <div className="flex justify-center gap-1.5">
                <ToothRow
                  teeth={UPPER_RIGHT}
                  selected={selected}
                  onToggle={toggleTooth}
                />
                <div className="w-px shrink-0 self-stretch bg-[var(--color-border)]" />
                <ToothRow
                  teeth={UPPER_LEFT}
                  selected={selected}
                  onToggle={toggleTooth}
                />
              </div>

              {showPrimary && (
                <div className="mt-1.5 flex justify-center gap-1.5">
                  <ToothRow
                    teeth={PRIMARY_UPPER_RIGHT}
                    selected={selected}
                    onToggle={toggleTooth}
                    primary
                  />
                  <div className="w-px shrink-0 self-stretch bg-[var(--color-border)]" />
                  <ToothRow
                    teeth={PRIMARY_UPPER_LEFT}
                    selected={selected}
                    onToggle={toggleTooth}
                    primary
                  />
                </div>
              )}

              {/* Arch curve divider */}
              <div className="my-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-[var(--color-border)]" />
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  kanan · kiri
                </span>
                <div className="h-px flex-1 bg-[var(--color-border)]" />
              </div>

              {showPrimary && (
                <div className="mb-1.5 flex justify-center gap-1.5">
                  <ToothRow
                    teeth={PRIMARY_LOWER_RIGHT}
                    selected={selected}
                    onToggle={toggleTooth}
                    reverse
                    primary
                  />
                  <div className="w-px shrink-0 self-stretch bg-[var(--color-border)]" />
                  <ToothRow
                    teeth={PRIMARY_LOWER_LEFT}
                    selected={selected}
                    onToggle={toggleTooth}
                    primary
                  />
                </div>
              )}

              {/* Permanent lower arch */}
              <div className="flex justify-center gap-1.5">
                <ToothRow
                  teeth={LOWER_RIGHT}
                  selected={selected}
                  onToggle={toggleTooth}
                  reverse
                />
                <div className="w-px shrink-0 self-stretch bg-[var(--color-border)]" />
                <ToothRow
                  teeth={LOWER_LEFT}
                  selected={selected}
                  onToggle={toggleTooth}
                />
              </div>
            </div>
          </div>
          <p className="mt-2 text-center font-body text-[11px] text-[var(--color-muted)] sm:hidden">
            Geser untuk lihat semua gigi →
          </p>

          {/* Selected summary */}
          <div className="mt-4 min-h-[2.25rem] rounded-lg border border-dashed border-[var(--color-border)] p-2">
            {selected.length === 0 ? (
              <p className="px-1.5 py-0.5 font-body text-xs text-[var(--color-muted)]">
                Belum ada gigi dipilih.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selected
                  .slice()
                  .sort((a, b) => a - b)
                  .map((n) => (
                    <span
                      key={n}
                      className="flex items-center gap-1 rounded-md bg-[var(--color-teal-700)] px-2 py-0.5 font-mono text-xs font-medium text-white"
                    >
                      {n}
                      <button
                        type="button"
                        onClick={() => toggleTooth(Number(n))}
                        aria-label={`Hapus gigi ${n}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--color-border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 font-body text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-teal-700)] px-5 py-2.5 font-body text-sm font-semibold text-white hover:bg-[var(--color-teal-600)]"
          >
            <Check size={15} />
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}

function ToothRow({ teeth, selected, onToggle, reverse, primary }) {
  const ordered = reverse ? teeth : teeth;
  return (
    <div className="flex shrink-0 gap-1">
      {ordered.map((num) => {
        const isSelected = selected.includes(String(num));
        return (
          <button
            key={num}
            type="button"
            onClick={() => onToggle(num)}
            className={`flex shrink-0 flex-col items-center justify-center rounded-md border font-mono font-semibold transition-colors ${
              primary ? "h-8 w-7 text-[11px]" : "h-10 w-8 text-xs"
            } ${
              isSelected
                ? "border-[var(--color-teal-700)] bg-[var(--color-teal-700)] text-white"
                : primary
                  ? "border-[var(--color-gold)]/50 bg-[var(--color-gold-soft)] text-[var(--color-gold)] hover:border-[var(--color-gold)] hover:bg-[var(--color-gold-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-ink)] hover:border-[var(--color-mint-400)] hover:bg-[var(--color-mint-200)]/40"
            }`}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
}
