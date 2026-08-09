import { useEffect, useState } from "react";

function formatDisplay(value) {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Rupiah input that formats with thousand separators as you type
 * (e.g. "1800000" -> "1.800.000") but reports back a plain number via
 * onChange, so callers never have to parse formatted text themselves.
 */
export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  error,
  className = "",
}) {
  const [display, setDisplay] = useState(formatDisplay(value));

  // Keep the formatted text in sync if `value` changes from outside
  // (e.g. switching from create to edit mode with a different record).
  useEffect(() => {
    setDisplay(formatDisplay(value));
  }, [value]);

  const handleChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (digitsOnly === "") {
      setDisplay("");
      onChange("");
      return;
    }
    const num = Number(digitsOnly);
    setDisplay(new Intl.NumberFormat("id-ID").format(num));
    onChange(num);
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--color-muted)]">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border bg-[var(--color-surface)] py-2.5 pl-10 pr-3.5 font-mono text-sm text-[var(--color-ink)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--color-teal-500)] ${
          error ? "border-[var(--color-coral)]" : "border-[var(--color-border)]"
        } ${className}`}
      />
    </div>
  );
}
