import type { SpreadsheetState } from "../types";
import { getExcelColumnName } from "./getColumnName";

const DEFAULT_COL_WIDTH = 140;
const DEFAULT_ROW_HEIGHT = 36;
const INITIAL_ROWS = 10;
const INITIAL_COLS = 13;

export const createInitialState = (): SpreadsheetState => ({
  columns: Array.from({ length: INITIAL_COLS }, (_, i) => ({
    name: getExcelColumnName(i),
    width: DEFAULT_COL_WIDTH,
  })),
  rows: Array.from({ length: INITIAL_ROWS }, (_, r) => ({
    id: r + 1,
    height: DEFAULT_ROW_HEIGHT,
    cells: Array(INITIAL_COLS).fill(""),
  })),
});
