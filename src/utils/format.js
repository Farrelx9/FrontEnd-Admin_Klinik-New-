export function formatCurrency(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

export function formatDate(value, options) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(
    "id-ID",
    options || { day: "numeric", month: "long", year: "numeric" },
  );
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
