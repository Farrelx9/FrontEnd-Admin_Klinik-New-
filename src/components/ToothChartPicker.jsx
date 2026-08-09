import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";

// FDI two-digit tooth notation, laid out the way a dentist's chart is
// conventionally drawn: patient's right on the viewer's left, upper arch
// on top, lower arch on bottom, each split into two quadrants by a
// center gap.
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

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
export default function ToothChartPicker({
  open,
  onClose,
  value,
  onConfirm,
  serviceName,
}) {
  const [selected, setSelected] = useState(parseValue(value));

  useEffect(() => {
    if (open) setSelected(parseValue(value));
  }, [open, value]);

  if (!open) return null;

  const toggleTooth = (num) => {
    setSelected((prev) =>
      prev.includes(String(num))
        ? prev.filter((n) => n !== String(num))
        : [...prev, String(num)]
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
      <div className="relative flex max-h-[90vh] w-full max-w-lg animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
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
          {/* On narrow screens 16 teeth across is wider than the modal,
              so the whole chart scrolls horizontally as one unit — upper
              and lower arches stay aligned while scrolling together. */}
          <div className="-mx-5 overflow-x-auto px-5">
            <div className="mx-auto w-max min-w-full">
              {/* Upper arch */}
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

              {/* Arch curve divider */}
              <div className="my-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-[var(--color-border)]" />
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  kanan · kiri
                </span>
                <div className="h-px flex-1 bg-[var(--color-border)]" />
              </div>

              {/* Lower arch */}
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

function ToothRow({ teeth, selected, onToggle, reverse }) {
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
            className={`flex h-10 w-8 shrink-0 flex-col items-center justify-center rounded-md border font-mono text-xs font-semibold transition-colors ${
              isSelected
                ? "border-[var(--color-teal-700)] bg-[var(--color-teal-700)] text-white"
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
