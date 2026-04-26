import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
const defaultDb = { users: [] };
function resolveDbPath() {
    const p = process.env["JSON_DB_PATH"] || "./data/db.json";
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}
function ensureDbFile(dbPath) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), "utf8");
    }
}
function readDb() {
    const dbPath = resolveDbPath();
    ensureDbFile(dbPath);
    const raw = fs.readFileSync(dbPath, "utf8");
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.users))
            return { ...defaultDb };
        return { users: parsed.users };
    }
    catch {
        return { ...defaultDb };
    }
}
function writeDb(next) {
    const dbPath = resolveDbPath();
    ensureDbFile(dbPath);
    const tmpPath = `${dbPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(next, null, 2), "utf8");
    fs.renameSync(tmpPath, dbPath);
}
export function findUserByEmail(emailLower) {
    const db = readDb();
    return db.users.find((u) => u.email === emailLower) ?? null;
}
export function findUserById(id) {
    const db = readDb();
    return db.users.find((u) => u.id === id) ?? null;
}
export function createUser(emailLower, passwordHash) {
    const db = readDb();
    const user = {
        id: randomUUID(),
        email: emailLower,
        passwordHash,
        createdAt: Date.now(),
    };
    db.users.push(user);
    writeDb(db);
    return user;
}
export function updateUserPassword(id, passwordHash) {
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1)
        return false;
    db.users[idx] = { ...db.users[idx], passwordHash };
    writeDb(db);
    return true;
}
export function setPasswordResetToken(emailLower, token, expiresAt) {
    const db = readDb();
    const idx = db.users.findIndex((u) => u.email === emailLower);
    if (idx === -1)
        return false;
    db.users[idx] = { ...db.users[idx], resetToken: token, resetTokenExpiresAt: expiresAt };
    writeDb(db);
    return true;
}
export function findUserByResetToken(token) {
    const db = readDb();
    return db.users.find((u) => u.resetToken === token) ?? null;
}
export function clearPasswordResetToken(userId) {
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1)
        return;
    const { resetToken: _rt, resetTokenExpiresAt: _re, ...rest } = db.users[idx];
    db.users[idx] = rest;
    writeDb(db);
}
