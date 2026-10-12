import "server-only";
import readExcelFile from "read-excel-file/node";

// Excel (.xlsx) and CSV files, read row by row. Every chunk repeats the
// sheet name and the column headings, so a row that lands in chunk 7 still
// says which column is which ("Name | Delegation date | Expires").
const CHUNK_SIZE = 1000;

export const SPREADSHEET_TYPES = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
};

/** Returns "xlsx", "csv" or null, going by extension first (browsers report CSV as many types). */
export function spreadsheetKind(filename, mimeType) {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "xlsx") return "xlsx";
  if (ext === "csv") return "csv";
  if (mimeType === SPREADSHEET_TYPES.xlsx) return "xlsx";
  if (mimeType === SPREADSHEET_TYPES.csv) return "csv";
  return null;
}

/**
 * @param {{ bytes: Uint8Array, kind: "xlsx" | "csv" }} input
 * @returns {Promise<{ text: string, pageNumber: null, sheet: string }[]>}
 */
export async function loadSpreadsheet({ bytes, kind }) {
  const sheets = kind === "xlsx" ? await readExcelFile(Buffer.from(bytes)) : [{ sheet: "CSV", data: parseCsv(Buffer.from(bytes).toString("utf-8")) }];

  const chunks = [];
  for (const { sheet, data } of sheets) {
    const rows = data.map((row) => row.map(formatCell)).filter((row) => row.some((c) => c !== ""));
    if (rows.length === 0) continue;

    const [header, ...body] = rows;
    const prefix = `Sheet: ${sheet}\nColumns: ${header.join(" | ")}\n`;
    const lines = body.length ? body.map((r) => r.join(" | ")) : [];

    let current = [];
    let size = prefix.length;
    const flush = () => {
      if (current.length) chunks.push({ text: `${prefix}${current.join("\n")}`, pageNumber: null, sheet });
      current = [];
      size = prefix.length;
    };
    for (const line of lines) {
      if (size + line.length + 1 > CHUNK_SIZE && current.length) flush();
      current.push(line);
      size += line.length + 1;
    }
    flush();
    if (body.length === 0) chunks.push({ text: prefix.trim(), pageNumber: null, sheet });
  }
  return chunks;
}

function formatCell(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  return String(value).replace(/\s+/g, " ").trim();
}

/** Small RFC 4180 parser: quoted fields, escaped quotes, commas and newlines inside quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
