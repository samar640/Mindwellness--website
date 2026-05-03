import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number; // epoch ms
  resetToken?: string;
  resetTokenExpiresAt?: number; // epoch ms
}

interface DbShape {
  users: DbUser[];
}

const defaultDb: DbShape = { users: [] };

function resolveDbPath() {
  const p = process.env["JSON_DB_PATH"] || path.join(__dirname, "../data/db.json");
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

function ensureDbFile(dbPath: string) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), "utf8");
  }
}

function readDb(): DbShape {
  const dbPath = resolveDbPath();
  ensureDbFile(dbPath);

  const raw = fs.readFileSync(dbPath, "utf8");
  try {
    const parsed = JSON.parse(raw) as DbShape;
    if (!parsed || !Array.isArray(parsed.users)) return { ...defaultDb };
    return { users: parsed.users };
  } catch {
    return { ...defaultDb };
  }
}

function writeDb(next: DbShape) {
  const dbPath = resolveDbPath();
  ensureDbFile(dbPath);

  const tmpPath = `${dbPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(next, null, 2), "utf8");
  fs.renameSync(tmpPath, dbPath);
}

export function findUserByEmail(emailLower: string): DbUser | null {
  const db = readDb();
  return db.users.find((u) => u.email === emailLower) ?? null;
}

export function findUserById(id: string): DbUser | null {
  const db = readDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export function createUser(emailLower: string, passwordHash: string): DbUser {
  const db = readDb();
  const existing = db.users.find((u) => u.email === emailLower);
  if (existing) {
    return existing;
  }
  const user: DbUser = {
    id: randomUUID(),
    email: emailLower,
    passwordHash,
    createdAt: Date.now(),
  };
  db.users.push(user);
  writeDb(db);
  return user;
}

export function updateUserPassword(id: string, passwordHash: string): boolean {
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  db.users[idx] = { ...db.users[idx], passwordHash };
  writeDb(db);
  return true;
}

export function setPasswordResetToken(emailLower: string, token: string, expiresAt: number): boolean {
  const db = readDb();
  const idx = db.users.findIndex((u) => u.email === emailLower);
  if (idx === -1) return false;
  db.users[idx] = { ...db.users[idx], resetToken: token, resetTokenExpiresAt: expiresAt };
  writeDb(db);
  return true;
}

export function findUserByResetToken(token: string): DbUser | null {
  const db = readDb();
  return db.users.find((u) => u.resetToken === token) ?? null;
}

export function clearPasswordResetToken(userId: string): void {
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  const { resetToken: _rt, resetTokenExpiresAt: _re, ...rest } = db.users[idx];
  db.users[idx] = rest;
  writeDb(db);
}

