import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data/chat");

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function filePathFor(sessionId: string): string {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "anonymous";
  return path.join(DATA_DIR, `${safe}.json`);
}

export function loadChatContext<T>(sessionId: string): T | null {
  try {
    ensureDir();
    const fp = filePathFor(sessionId);
    if (!fs.existsSync(fp)) return null;
    const raw = fs.readFileSync(fp, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveChatContext(sessionId: string, context: unknown): void {
  try {
    ensureDir();
    const fp = filePathFor(sessionId);
    const tmp = `${fp}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(context, null, 2), "utf8");
    fs.renameSync(tmp, fp);
  } catch (error) {
    console.error("Failed to save chat memory:", error);
  }
}
