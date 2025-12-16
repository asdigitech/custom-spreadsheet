import type { SpreadsheetState } from "../types";

export const isScopedDuplicate = (
  value: string,
  sheet: SpreadsheetState,
  rowIndex: number,
  colIndex: number
): string | null => {
  if (!value.trim()) return null;

  if (sheet.columns[colIndex]?.unique) {
    const duplicate = sheet.rows.some(
      (row, rIdx) => rIdx !== rowIndex && row.cells[colIndex] === value
    );

    if (duplicate) {
      return `${value} already exists in column ${sheet.columns[colIndex].name}`;
    }
  }

  if (sheet.rows[rowIndex]?.unique) {
    const duplicate = sheet.rows[rowIndex].cells.some(
      (cell, cIdx) => cIdx !== colIndex && cell === value
    );

    if (duplicate) {
      return `${value} already exists in row ${sheet.rows[rowIndex].id}`;
    }
  }

  return null;
};
