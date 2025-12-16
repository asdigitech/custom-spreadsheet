import * as XLSX from "xlsx";
import type { SpreadsheetState } from "../types";

export const exportToXlsx = (sheet: SpreadsheetState, fileName?: string) => {
  const data = [
    sheet.columns.map((c) => c.name),
    ...sheet.rows.map((r) => r.cells),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const finalName =
    fileName?.trim() ||
    `custom_spreadsheet_${new Date().toISOString().replace(/[:.]/g, "-")}`;

  XLSX.writeFile(workbook, `${finalName}.xlsx`);
};
