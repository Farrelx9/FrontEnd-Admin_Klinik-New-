import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Parse YYYY-MM-DD without UTC timezone offset issue
function parseDateStr(str) {
  if (!str) return new Date();
  const [year, month, day] = str.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

// Format Date object into YYYY-MM-DD
function toYYYYMMDD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr, variant = "medium") {
  if (!dateStr) return "Pilih Tanggal";
  const d = parseDateStr(dateStr);

  if (variant === "long") {
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (variant === "short") {
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // Medium default: "Sen, 17 Agu 2026"
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Pilih Tanggal",
  variant = "medium",
  className = "",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedDate = value ? parseDateStr(value) : null;
  const today = new Date();
  const todayStr = toYYYYMMDD(today);

  const [viewYear, setViewYear] = useState(selectedDate ? selectedDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.getMonth() : today.getMonth());

  // Sync view state when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseDateStr(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dayNum) => {
    const d = new Date(viewYear, viewMonth, dayNum);
    const dateStr = toYYYYMMDD(d);
    onChange(dateStr);
    setIsOpen(false);
  };

  const handlePreset = (deltaDays) => {
    const target = new Date();
    target.setDate(target.getDate() + deltaDays);
    const dateStr = toYYYYMMDD(target);
    onChange(dateStr);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setIsOpen(false);
  };

  // Build calendar matrix
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarCells = [];

  // Prev month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isPrevMonth: true,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currentStr = toYYYYMMDD(new Date(viewYear, viewMonth, d));
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      isToday: currentStr === todayStr,
      isSelected: value === currentStr,
      dateStr: currentStr,
    });
  }

  // Next month padding to fill grid to multiple of 7
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    calendarCells.push({
      day: d,
      isCurrentMonth: false,
      isNextMonth: true,
    });
  }

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2.5 rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-left font-body text-sm text-[var(--color-ink)] transition-all ${
          isOpen
            ? "border-[var(--color-teal-600)] ring-2 ring-[var(--color-teal-500)]/20"
            : "border-[var(--color-border)] hover:border-[var(--color-mint-400)] hover:bg-[var(--color-bg)]/40"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <CalendarIcon size={16} className="shrink-0 text-[var(--color-teal-600)]" />
          <span className="truncate font-medium">
            {value ? formatDisplayDate(value, variant) : <span className="text-[var(--color-muted)]">{placeholder}</span>}
          </span>
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[310px] rounded-xl border border-[var(--color-border)] bg-white p-3.5 shadow-xl animate-fade-in-up">
          {/* Header Month / Year & Nav */}
          <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/50"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="font-display text-sm font-bold text-[var(--color-ink)]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/50"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="mb-3 flex items-center justify-between gap-1 rounded-lg bg-[var(--color-bg)] p-1 text-xs">
            <button
              type="button"
              onClick={() => handlePreset(-1)}
              className="flex-1 rounded-md px-1.5 py-1 font-medium text-[var(--color-muted)] hover:bg-white hover:text-[var(--color-ink)] hover:shadow-xs"
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => handlePreset(0)}
              className="flex-1 rounded-md bg-white py-1 font-semibold text-[var(--color-teal-700)] shadow-xs"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handlePreset(1)}
              className="flex-1 rounded-md px-1.5 py-1 font-medium text-[var(--color-muted)] hover:bg-white hover:text-[var(--color-ink)] hover:shadow-xs"
            >
              Besok
            </button>
          </div>

          {/* Days of Week */}
          <div className="mb-1.5 grid grid-cols-7 text-center font-body text-[11px] font-semibold text-[var(--color-muted)]">
            {DAY_NAMES.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`pad-${idx}`}
                    className="flex h-8 items-center justify-center font-body text-xs text-[var(--color-border)] opacity-40 select-none"
                  >
                    {cell.day}
                  </div>
                );
              }

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => handleSelectDay(cell.day)}
                  className={`flex h-8 items-center justify-center rounded-lg font-body text-xs transition-all ${
                    cell.isSelected
                      ? "bg-[var(--color-teal-700)] font-bold text-white shadow-xs"
                      : cell.isToday
                      ? "border border-[var(--color-teal-600)] font-bold text-[var(--color-teal-700)] bg-[var(--color-mint-200)]/40 hover:bg-[var(--color-mint-200)]"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-mint-200)]/40 hover:font-semibold"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
