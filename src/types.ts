export type CellValue = string;

export type RowData = {
  id: number;
  cells: CellValue[];
};

export type Column = {
  name: string;
  width: number;
};

export type Row = {
  id: number;
  height: number;
  cells: string[];
};

export type SpreadsheetState = {
  columns: {
    name: string;
    width: number;
    unique?: boolean;
  }[];
  rows: {
    id: number;
    height: number;
    unique?: boolean;
    cells: string[];
  }[];
};
