import { formatDate } from "./format";

const TEAL = "FF0E4F4F";
const MINT = "FFC9EAE0";
const INK = "FF16292A";

/**
 * Generates and downloads a properly formatted .xlsx report — unlike a
 * CSV, this gets real currency-formatted number cells (not text), sized
 * columns, a bold styled header row, and a totals row, so it actually
 * looks presentable the moment it's opened in Excel/Sheets.
 *
 * exceljs is dynamically imported here (not at module top-level) since
 * it's a fairly large dependency — this way it's only pulled into the
 * bundle when someone actually clicks "Export Excel", not on every page
 * load of the Reports screen.
 */
export async function exportReportToExcel({
  range,
  kpis,
  payments,
  topServices,
}) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "drg. Irna Dental Care";
  workbook.created = new Date();

  // ---- Sheet 1: Ringkasan ----
  const summary = workbook.addWorksheet("Ringkasan");
  summary.columns = [{ width: 28 }, { width: 22 }];

  summary.mergeCells("A1:B1");
  summary.getCell("A1").value = "Laporan drg. Irna Dental Care";
  summary.getCell("A1").font = { bold: true, size: 16, color: { argb: TEAL } };

  summary.mergeCells("A2:B2");
  summary.getCell("A2").value = `Periode: ${formatDate(range.start, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })} – ${formatDate(range.end, { day: "numeric", month: "long", year: "numeric" })}`;
  summary.getCell("A2").font = { italic: true, color: { argb: "FF627774" } };

  const summaryHeaderRow = summary.addRow(["Ringkasan", ""]);
  summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  summaryHeaderRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
  });
  summary.getRow(4).values = ["Metrik", "Nilai"]; // header placeholder row skipped visually

  const kpiRows = [
    { label: "Pendapatan Periode Ini", value: kpis.revenue, currency: true },
    {
      label: "Jumlah Transaksi",
      value: kpis.transactionCount,
      currency: false,
    },
    { label: "Sisa Piutang (Total)", value: kpis.outstanding, currency: true },
  ];
  kpiRows.forEach(({ label, value, currency }, i) => {
    const row = summary.addRow([label, value]);
    if (currency) {
      row.getCell(2).numFmt = '"Rp" #,##0';
    } else {
      row.getCell(2).numFmt = "#,##0";
    }
    row.getCell(2).alignment = { horizontal: "right" };
    if (i % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: MINT },
        };
      });
    }
  });

  // ---- Sheet 2: Transaksi ----
  const tx = workbook.addWorksheet("Transaksi");
  tx.columns = [
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Pasien", key: "patient", width: 26 },
    { header: "Nominal", key: "amount", width: 18 },
    { header: "Metode", key: "method", width: 14 },
  ];

  const header = tx.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
    cell.alignment = { vertical: "middle" };
  });

  const METHOD_LABEL = {
    CASH: "Tunai",
    TRANSFER: "Transfer",
    DEBIT: "Debit",
    QRIS: "QRIS",
  };

  payments
    .slice()
    .sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt))
    .forEach((p, i) => {
      const row = tx.addRow({
        date: formatDate(p.paidAt, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        patient: p.patientName || "—",
        amount: Number(p.amount || 0),
        method: METHOD_LABEL[p.method] || p.method,
      });
      row.getCell("amount").numFmt = '"Rp" #,##0';
      if (i % 2 === 0) {
        row.eachCell((cell) => {
          if (!cell.fill)
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF5F8F7" },
            };
        });
      }
    });

  const totalRow = tx.addRow({
    date: "",
    patient: "TOTAL",
    amount: payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    method: "",
  });
  totalRow.font = { bold: true };
  totalRow.getCell("amount").numFmt = '"Rp" #,##0';
  totalRow.eachCell((cell) => {
    cell.border = { top: { style: "thin", color: { argb: INK } } };
  });

  // ---- Sheet 3: Layanan Terpopuler ----
  if (topServices.length > 0) {
    const services = workbook.addWorksheet("Layanan Terpopuler");
    services.columns = [
      { header: "Layanan", key: "name", width: 32 },
      { header: "Jumlah", key: "count", width: 12 },
      { header: "Total Nilai", key: "revenue", width: 18 },
    ];
    const svcHeader = services.getRow(1);
    svcHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
    svcHeader.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: TEAL },
      };
    });
    topServices.forEach((s) => {
      const row = services.addRow({
        name: s.name,
        count: s.count,
        revenue: s.revenue,
      });
      row.getCell("revenue").numFmt = '"Rp" #,##0';
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `laporan-klinik-${range.start}-sd-${range.end}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
