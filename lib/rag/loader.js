import "server-only";
import { extractText } from "unpdf";
import { transcribeFile } from "./gemini.js";

// The "Default Data Loader" node: binary file -> pages -> chunks.
// Splitter settings are n8n's defaults (Recursive Character Text
// Splitter, 1000 chars, 200 overlap) so retrieval behaves the same.
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const SEPARATORS = ["\n\n", "\n", " ", ""];

/**
 * @param {{ bytes: Uint8Array, mimeType: string, description?: string }} input
 * @returns {Promise<{ text: string, pageNumber: number | null }[]>}
 */
export async function loadAndSplit({ bytes, mimeType, description }) {
  const pages = await loadPages({ bytes, mimeType, description });

  return pages.flatMap(({ text, pageNumber }) =>
    splitText(normalise(text)).map((chunk) => ({ text: chunk, pageNumber }))
  );
}

async function loadPages({ bytes, mimeType, description }) {
  if (mimeType === "application/pdf") {
    // unpdf takes ownership of the buffer, so hand it a copy we can still
    // send to Gemini if the PDF turns out to be a scan.
    const { text } = await extractText(bytes.slice());
    const pages = text.map((pageText, i) => ({ text: pageText, pageNumber: i + 1 }));
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
