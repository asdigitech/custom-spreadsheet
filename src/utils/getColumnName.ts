import type { SpreadsheetState } from "../types";

export const getExcelColumnName = (index: number): string => {
  let name = "";
  let i = index + 1;

  while (i > 0) {
    const rem = (i - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    i = Math.floor((i - 1) / 26);
  }

  return name;
};

export const isScopedDuplicated = (
  value: string,
  sheet: SpreadsheetState,
  rowIndex: number,
  colIndex: number
): string | null => {
  if (!value.trim()) return null;

  const duplicates: string[] = [];

  const colName = getExcelColumnName(colIndex);
  const rowNumber = rowIndex + 1;

  /* ===== COLUMN-LEVEL UNIQUENESS ===== */
  if (sheet.columns[colIndex]?.unique) {
    sheet.rows.forEach((row, rIdx) => {
      if (rIdx !== rowIndex && row.cells[colIndex] === value) {
        duplicates.push(`${colName}${rIdx + 1}`);
      }
    });
  }

  /* ===== ROW-LEVEL UNIQUENESS ===== */
  if (sheet.rows[rowIndex]?.unique) {
    sheet.rows[rowIndex].cells.forEach((cell, cIdx) => {
      if (cIdx !== colIndex && cell === value) {
        duplicates.push(`${getExcelColumnName(cIdx)}${rowNumber}`);
      }
    });
  }

  if (duplicates.length > 0) {
    return `"${value}" already exists at ${duplicates.join(", ")}`;
  }

  return null;
};
