import "server-only";
import { extractTextItems } from "unpdf";
import { transcribeFile } from "./llm.js";
import { loadSpreadsheet, spreadsheetKind } from "./spreadsheet.js";

// The "Default Data Loader" node: binary file -> pages -> chunks.
// Splitter settings are n8n's defaults (Recursive Character Text
// Splitter, 1000 chars, 200 overlap) so retrieval behaves the same.
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const SEPARATORS = ["\n\n", "\n", " ", ""];

/**
 * @param {{ bytes: Uint8Array, mimeType: string, filename?: string, description?: string }} input
 * @returns {Promise<{ text: string, pageNumber: number | null, sheet?: string }[]>}
 */
export async function loadAndSplit({ bytes, mimeType, filename = "", description }) {
  const kind = spreadsheetKind(filename, mimeType);
  if (kind) return loadSpreadsheet({ bytes, kind });

  const pages = await loadPages({ bytes, mimeType, description });

  return pages.flatMap(({ text, pageNumber }) =>
    splitText(normalise(text)).map((chunk) => ({ text: chunk, pageNumber }))
  );
}

async function loadPages({ bytes, mimeType, description }) {
  if (mimeType === "application/pdf") {
    // unpdf takes ownership of the buffer, so hand it a copy we can still
    // send to Gemini if the PDF turns out to be a scan.
    const { items } = await extractTextItems(bytes.slice());
    const pages = items.map((pageItems, i) => ({ text: itemsToText(pageItems), pageNumber: i + 1 }));
    if (pages.some((p) => p.text.trim())) {
      return pages;
    }
  }

  // Images, and PDFs with no text layer (scans): let Gemini read them.
  const transcript = await transcribeFile({
    base64: Buffer.from(bytes).toString("base64"),
    mimeType,
    description,
  });
  return [{ text: transcript, pageNumber: null }];
}

// Plain text extraction glues table cells together ("JohnSarah1:09am-2:00pm"),
// which destroys schedules, price lists and forms. Rebuild lines from
// the glyph positions instead: same baseline = same row, a wide gap
// between items = a new cell, written as " | ".
function itemsToText(items) {
  const words = items.filter((it) => it.str && it.str.trim());
  words.sort((a, b) => b.y - a.y || a.x - b.x);

  const rows = [];
  for (const it of words) {
    const row = rows[rows.length - 1];
    const tolerance = Math.max(it.fontSize || 8, 4) * 0.5;
    if (row && Math.abs(row.y - it.y) <= tolerance) row.items.push(it);
    else rows.push({ y: it.y, items: [it] });
  }

  const lines = rows.map((row) => {
    row.items.sort((a, b) => a.x - b.x);
    let line = "";
    let prevEnd = null;
    for (const it of row.items) {
      const size = Math.max(it.fontSize || 8, 4);
      if (prevEnd !== null) {
        const gap = it.x - prevEnd;
        if (gap > size * 1.5) line += " | ";
        else if (gap > size * 0.15 && !/\s$/.test(line) && !/^\s/.test(it.str)) line += " ";
      }
      line += it.str;
      prevEnd = it.x + it.width;
    }
    return line.trim();
  });

  // Blank line between rows that are far apart vertically = paragraph break.
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    const next = rows[i + 1];
    if (next && rows[i].y - next.y > Math.max(rows[i].items[0].fontSize || 8, 4) * 2.2) out.push("");
  }
  return out.join("\n");
}

function normalise(text) {
  return text.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

// ---------- RecursiveCharacterTextSplitter (LangChain's algorithm) ----------

function splitText(text, separators = SEPARATORS) {
  if (!text) return [];

  let separator = separators[separators.length - 1];
  let remaining = [];
  for (let i = 0; i < separators.length; i++) {
    if (separators[i] === "" || text.includes(separators[i])) {
      separator = separators[i];
      remaining = separators.slice(i + 1);
      break;
    }
  }

  const splits = text.split(separator).filter(Boolean);
  const chunks = [];
  let small = [];

  for (const piece of splits) {
    if (piece.length < CHUNK_SIZE) {
      small.push(piece);
      continue;
    }
    if (small.length) {
      chunks.push(...mergeSplits(small, separator));
      small = [];
    }
    chunks.push(...(remaining.length ? splitText(piece, remaining) : [piece]));
  }
  if (small.length) {
    chunks.push(...mergeSplits(small, separator));
  }
  return chunks;
}

function mergeSplits(splits, separator) {
  const chunks = [];
  const current = [];
  let total = 0;

  for (const piece of splits) {
    const joinCost = current.length ? separator.length : 0;
    if (total + piece.length + joinCost > CHUNK_SIZE && current.length) {
      const chunk = current.join(separator).trim();
      if (chunk) chunks.push(chunk);

      // Drop from the front until what's left fits as overlap.
      while (
        total > CHUNK_OVERLAP ||
        (total + piece.length + (current.length ? separator.length : 0) > CHUNK_SIZE && total > 0)
      ) {
        total -= current[0].length + (current.length > 1 ? separator.length : 0);
        current.shift();
      }
    }
    current.push(piece);
    total += piece.length + (current.length > 1 ? separator.length : 0);
  }

  const last = current.join(separator).trim();
  if (last) chunks.push(last);
  return chunks;
}
