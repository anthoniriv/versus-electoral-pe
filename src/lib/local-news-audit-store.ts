import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
  NewsOwnershipEvidence,
  NewsOwnershipResult,
  NewsOwnershipVerdict,
} from "./news-ownership-audit";

export interface HumanOwnershipReview {
  verdict: NewsOwnershipVerdict;
  note?: string;
  reviewedAt: string;
}

export interface NewsOwnershipAuditRecord {
  newsId: number;
  machine?: {
    evidence: NewsOwnershipEvidence;
    result: NewsOwnershipResult;
    evaluatedAt: string;
  };
  review?: HumanOwnershipReview;
}

interface AuditFile {
  version: 1;
  records: Record<string, NewsOwnershipAuditRecord>;
}

const DEFAULT_PATH = join(process.cwd(), ".local", "news-ownership-audit.json");
const EMPTY_FILE: AuditFile = { version: 1, records: {} };
let writeQueue: Promise<void> = Promise.resolve();

export class LocalAuditStoreError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "LocalAuditStoreError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateFile(value: unknown): AuditFile {
  if (!isObject(value) || value.version !== 1 || !isObject(value.records)) {
    throw new LocalAuditStoreError("The local audit file has an unsupported format.");
  }

  for (const [key, record] of Object.entries(value.records)) {
    if (!isObject(record) || !Number.isInteger(record.newsId) || String(record.newsId) !== key) {
      throw new LocalAuditStoreError("The local audit file contains an invalid record.");
    }
  }
  return value as unknown as AuditFile;
}

export async function readNewsOwnershipAudits(path = DEFAULT_PATH): Promise<AuditFile> {
  try {
    return validateFile(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    if (isObject(error) && error.code === "ENOENT") return structuredClone(EMPTY_FILE);
    if (error instanceof LocalAuditStoreError) throw error;
    throw new LocalAuditStoreError("The local audit file could not be read safely.", error);
  }
}

async function writeAuditFile(file: AuditFile, path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(file, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, path);
}

async function updateRecord(
  newsId: number,
  path: string,
  update: (current: NewsOwnershipAuditRecord) => NewsOwnershipAuditRecord,
): Promise<NewsOwnershipAuditRecord> {
  let saved!: NewsOwnershipAuditRecord;
  const operation = writeQueue.then(async () => {
    const file = await readNewsOwnershipAudits(path);
    const current = file.records[String(newsId)] ?? { newsId };
    saved = update(current);
    file.records[String(newsId)] = saved;
    await writeAuditFile(file, path);
  });
  writeQueue = operation.catch(() => undefined);
  await operation;
  return saved;
}

export function saveMachineOwnershipAudit(
  newsId: number,
  evidence: NewsOwnershipEvidence,
  result: NewsOwnershipResult,
  path = DEFAULT_PATH,
): Promise<NewsOwnershipAuditRecord> {
  return updateRecord(newsId, path, (current) => ({
    ...current,
    machine: { evidence, result, evaluatedAt: new Date().toISOString() },
  }));
}

export function saveHumanOwnershipReview(
  newsId: number,
  verdict: NewsOwnershipVerdict,
  note?: string,
  path = DEFAULT_PATH,
): Promise<NewsOwnershipAuditRecord> {
  const trimmedNote = note?.trim();
  return updateRecord(newsId, path, (current) => ({
    ...current,
    review: {
      verdict,
      ...(trimmedNote ? { note: trimmedNote.slice(0, 500) } : {}),
      reviewedAt: new Date().toISOString(),
    },
  }));
}
