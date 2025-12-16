import { useState } from "react";
import { createInitialState } from "./utils/initialState";
import { getExcelColumnName } from "./utils/getColumnName";
import type { SpreadsheetState } from "./types";
import { useEffect, useRef } from "react";
import { exportToXlsx } from "./utils/fileExporter";
import { isScopedDuplicated } from "./utils/getColumnName";

type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  type: "row" | "column" | null;
  index: number | null;
};

export default function CustomSpreadsheet() {
  const [currentFileName, setCurrentFileName] = useState(
    `custom_spreadsheet_${new Date().toISOString().replace(/[:.]/g, "-")}`
  );
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");

  const [sheet, setSheet] = useState<SpreadsheetState>(createInitialState());
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const autoSaveTimer = useRef<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: null,
    index: null,
  });

  //load auto save data
  useEffect(() => {
    const saved = localStorage.getItem("customSpreadsheet");
    const savedName = localStorage.getItem("customSpreadsheetName");

    if (saved) setSheet(JSON.parse(saved));
    if (savedName) setCurrentFileName(savedName);
  }, []);

  //auto save
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    setAutoSaveStatus(`Auto file saving...`);

    autoSaveTimer.current = window.setTimeout(() => {
      localStorage.setItem("customSpreadsheet", JSON.stringify(sheet));

      setAutoSaveStatus(`All changes saved`);
    }, 500);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [sheet, currentFileName]);

  const saveFile = () => {
    exportToXlsx(sheet, currentFileName);
  };

  const saveFileAs = () => {
    if (!fileName.trim()) return;

    setCurrentFileName(fileName.trim());
    localStorage.setItem("customSpreadsheetName", fileName.trim());

    exportToXlsx(sheet, fileName.trim());
    setShowSaveAs(false);
    setFileName("");
  };

  useEffect(() => {
    const closeMenu = () =>
      setContextMenu((prev) => ({ ...prev, visible: false }));

    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  // delete row or column
  const deleteRow = (rowIndex: number) => {
    setSheet((prev: any) => ({
      ...prev,
      rows: prev.rows
        .filter((_: any, i: number) => i !== rowIndex)
        .map((row: any, i: number) => ({
          ...row,
          id: i + 1, // re-number rows
        })),
    }));
  };

  const deleteColumn = (colIndex: number) => {
    setSheet((prev) => {
      const filteredColumns = prev.columns.filter((_, i) => i !== colIndex);
      const normalizedColumns = filteredColumns.map((col, i) => ({
        ...col,
        name: getExcelColumnName(i),
      }));
      const normalizedRows = prev.rows.map((row) => ({
        ...row,
        cells: row.cells.filter((_, i) => i !== colIndex),
      }));

      return {
        columns: normalizedColumns,
        rows: normalizedRows,
      };
    });
  };

  /* ===================== CELL CHANGE ===================== */
  const handleChange = (rowIndex: number, colIndex: number, value: string) => {
    const errorMsg = isScopedDuplicated(value, sheet, rowIndex, colIndex);

    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setError("");

    setSheet((prev) => {
      const rows = [...prev.rows];
      rows[rowIndex] = {
        ...rows[rowIndex],
        cells: rows[rowIndex].cells.map((cell, i) =>
          i === colIndex ? value : cell
        ),
      };
      return { ...prev, rows };
    });
  };

  /* ===================== ADD ROW ===================== */
  const addRow = () => {
    setSheet((prev: any) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: prev.rows.length + 1,
          height: 36,
          cells: Array(prev.columns.length).fill(""),
        },
      ],
    }));
  };

  /* ===================== ADD COLUMN ===================== */
  const addColumn = () => {
    setSheet((prev: any) => ({
      columns: [
        ...prev.columns,
        { name: getExcelColumnName(prev.columns.length), width: 140 },
      ],
      rows: prev.rows.map((row: any) => ({
        ...row,
        cells: [...row.cells, ""],
      })),
    }));
  };

  /* ===================== COLUMN RESIZE ===================== */
  const startColumnResize = (colIndex: number, startX: number) => {
    const startWidth = sheet.columns[colIndex].width;

    const onMouseMove = (e: MouseEvent) => {
      const width = Math.max(60, startWidth + e.clientX - startX);

      setSheet((prev: any) => {
        const columns = [...prev.columns];
        columns[colIndex] = { ...columns[colIndex], width };
        return { ...prev, columns };
      });
    };

    const stop = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stop);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stop);
  };

  /* ===================== ROW RESIZE ===================== */
  const startRowResize = (rowIndex: number, startY: number) => {
    const startHeight = sheet.rows[rowIndex].height;

    const onMouseMove = (e: MouseEvent) => {
      const height = Math.max(24, startHeight + e.clientY - startY);

      setSheet((prev: any) => {
        const rows = [...prev.rows];
        rows[rowIndex] = { ...rows[rowIndex], height };
        return { ...prev, rows };
      });
    };

    const stop = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stop);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stop);
  };

  /* ===================== RENDER ===================== */
  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-2">
        {/* File info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">File: {currentFileName}.xlsx</p>
            <p className="text-xs text-gray-500">{autoSaveStatus}</p>
          </div>

          <div className="flex gap-5">
            <button onClick={saveFile} className="btn cursor-pointer">
              💾 Save file
            </button>

            <button
              onClick={() => setShowSaveAs((v) => !v)}
              className="btn cursor-pointer"
            >
              💾 Save file as
            </button>
          </div>
        </div>

        {/* Save As input */}
        {showSaveAs && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter file name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="border px-2 py-1 rounded w-64"
            />
            <button onClick={saveFileAs} className="btn">
              Save
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={addRow} className="btn">
          ➕ Row
        </button>
        <button onClick={addColumn} className="btn">
          ➕ Column
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="overflow-auto rounded">
        <table className="border-collapse select-none mb-2">
          <thead>
            <tr>
              <th className="w-12 border bg-gray-100" />

              {sheet.columns.map((col: any, i: any) => (
                <th
                  key={col.name}
                  style={{ width: col.width }}
                  className="relative border bg-gray-100 px-2"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      type: "column",
                      index: i,
                    });
                  }}
                >
                  {col.name}
                  <div
                    onMouseDown={(e) => startColumnResize(i, e.clientX)}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sheet.rows.map((row: any, rIdx: any) => (
              <tr key={row.id} style={{ height: row.height }}>
                <td
                  className="relative border bg-gray-100 text-center"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      type: "row",
                      index: rIdx,
                    });
                  }}
                >
                  {row.id}
                  <div
                    onMouseDown={(e) => startRowResize(rIdx, e.clientY)}
                    className="absolute bottom-0 left-0 h-1 w-full cursor-row-resize hover:bg-blue-500"
                  />
                </td>

                {row.cells.map((cell: string, cIdx: number) => (
                  <td
                    key={cIdx}
                    style={{ width: sheet.columns[cIdx].width }}
                    className="border"
                  >
                    <input
                      value={cell}
                      onChange={(e) => handleChange(rIdx, cIdx, e.target.value)}
                      className="w-full h-full px-2 outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <span className="text-gray-400 text-xs">
          &copy; 2025 Custom Spreadsheet. All rights reserved. Product by AS
          DigiTech
        </span>
      </div>
      {contextMenu.visible && (
        <div
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          className="fixed z-50 w-60 bg-white border rounded shadow-md text-sm"
        >
          {contextMenu.type === "row" && (
            <>
              <button
                className="w-full text-left px-3 cursor-pointer py-2 hover:bg-gray-100"
                onClick={() => {
                  setSheet((prev) => {
                    const rows = [...prev.rows];
                    rows[contextMenu.index!] = {
                      ...rows[contextMenu.index!],
                      unique: !rows[contextMenu.index!].unique,
                    };
                    return { ...prev, rows };
                  });
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                {sheet.rows[contextMenu.index!]?.unique
                  ? "🔓 Make Entire Row Un-unique"
                  : "🔒 Make Entire Row Unique"}
              </button>

              <button
                className="w-full text-left px-3 py-2 cursor-pointer hover:bg-red-50 text-red-600"
                onClick={() => {
                  deleteRow(contextMenu.index!);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                🗑 Delete Row
              </button>
            </>
          )}

          {contextMenu.type === "column" && (
            <>
              <button
                className="w-full text-left px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSheet((prev) => {
                    const columns = [...prev.columns];
                    columns[contextMenu.index!] = {
                      ...columns[contextMenu.index!],
                      unique: !columns[contextMenu.index!].unique,
                    };
                    return { ...prev, columns };
                  });
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                {sheet.columns[contextMenu.index!]?.unique
                  ? "🔓 Make Entire Column Un-unique"
                  : "🔒 Make Entire Column Unique"}
              </button>

              <button
                className="w-full text-left px-3 py-2 cursor-pointer hover:bg-red-50 text-red-600"
                onClick={() => {
                  deleteColumn(contextMenu.index!);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                🗑 Delete Column
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
