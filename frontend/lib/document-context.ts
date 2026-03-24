import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

export type StoredDocumentContext = {
  id: string;
  uploader: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
  content: string;
  excerpt: string;
};

const CONTEXT_DIR = join(process.cwd(), "nlp_model", "data");
const CONTEXT_FILE = join(CONTEXT_DIR, "contexts.json");

async function ensureStore() {
  if (!existsSync(CONTEXT_DIR)) {
    await mkdir(CONTEXT_DIR, { recursive: true });
  }
  if (!existsSync(CONTEXT_FILE)) {
    await writeFile(CONTEXT_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

async function readStore(): Promise<StoredDocumentContext[]> {
  await ensureStore();
  const raw = await readFile(CONTEXT_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(items: StoredDocumentContext[]) {
  await ensureStore();
  await writeFile(CONTEXT_FILE, JSON.stringify(items, null, 2), "utf-8");
}

function cleanText(input: string): string {
  return input.replace(/\0/g, "").replace(/\s+/g, " ").trim();
}

export async function saveDocumentContext(params: {
  uploader: string;
  filename: string;
  mimeType: string;
  content: string;
}) {
  const normalized = cleanText(params.content);
  if (!normalized) return null;

  const item: StoredDocumentContext = {
    id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    uploader: params.uploader,
    filename: params.filename,
    mimeType: params.mimeType,
    uploadedAt: new Date().toISOString(),
    content: normalized.slice(0, 60_000),
    excerpt: normalized.slice(0, 500),
  };

  const existing = await readStore();
  existing.unshift(item);
  await writeStore(existing.slice(0, 300));
  return item;
}

export async function getRecentContextText(options?: {
  uploader?: string;
  limit?: number;
  maxChars?: number;
}): Promise<string> {
  const limit = options?.limit ?? 5;
  const maxChars = options?.maxChars ?? 8_000;
  const items = await readStore();

  const filtered = options?.uploader
    ? items.filter((item) => item.uploader === options.uploader)
    : items;

  const selected = filtered.slice(0, limit);
  if (selected.length === 0) return "";

  const merged = selected
    .map((item) => `[Source: ${item.filename}]\n${item.content}`)
    .join("\n\n")
    .slice(0, maxChars);

  return merged;
}
