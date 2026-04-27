import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { clearPasswordResetToken, createUser, findUserByEmail, findUserById, findUserByResetToken, setPasswordResetToken, updateUserPassword, } from "../db/jsondb.js";
const router = Router();
const RegisterBody = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
const LoginBody = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
const ForgotPasswordBody = z.object({
    email: z.string().email(),
});
const ResetPasswordBody = z.object({
    token: z.string().min(10),
    newPassword: z.string().min(6),
});
// POST /auth/register
router.post("/auth/register", async (req, res) => {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input. Email and password (min 6 chars) required." });
        return;
    }
    const { email, password } = parsed.data;
    const emailLower = email.trim().toLowerCase();
    try {
        // Check if email already exists
        const existing = findUserByEmail(emailLower);
        if (existing) {
            res.status(409).json({ error: "An account with this email already exists." });
            return;
        }
        // Hash password with bcrypt (12 rounds)
        const passwordHash = await bcrypt.hash(password, 12);
        // Insert user
        const newUser = createUser(emailLower, passwordHash);
        // Set session
        req.session.userId = newUser.id;
        req.session.userEmail = newUser.email;
        res.status(201).json({ id: newUser.id, email: newUser.email });
    }
    catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});
// POST /auth/login
router.post("/auth/login", async (req, res) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Please enter a valid email and password." });
        return;
    }
    const { email, password } = parsed.data;
    const emailLower = email.trim().toLowerCase();
    try {
        const user = findUserByEmail(emailLower);
        if (!user) {
            res.status(404).json({ error: "Email not found." });
            return;
        }
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            res.status(401).json({ error: "Wrong password." });
            return;
        }
        // Set session
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        res.json({ id: user.id, email: user.email });
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});
// POST /auth/forgot-password
// Generates a temporary token and stores it in the JSON DB.
// No email service is configured, so the token is returned for local dev.
router.post("/auth/forgot-password", (req, res) => {
    const parsed = ForgotPasswordBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Please enter a valid email." });
        return;
    }
    const emailLower = parsed.data.email.trim().toLowerCase();
    const user = findUserByEmail(emailLower);
    if (!user) {
        res.status(404).json({ error: "Email not found." });
        return;
    }
    const token = randomUUID();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    setPasswordResetToken(emailLower, token, expiresAt);
    res.json({
        message: "Reset token created. Use it to set a new password.",
        token,
        expiresAt,
    });
});
// POST /auth/reset-password
// Resets password via temporary token stored in JSON DB.
router.post("/auth/reset-password", async (req, res) => {
    const parsed = ResetPasswordBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid token or password (min 6 chars)." });
        return;
    }
    const { token, newPassword } = parsed.data;
    try {
        const user = findUserByResetToken(token);
        if (!user) {
            res.status(400).json({ error: "Invalid or expired token." });
            return;
        }
        if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt < Date.now()) {
            clearPasswordResetToken(user.id);
            res.status(400).json({ error: "Invalid or expired token." });
            return;
        }
        const passwordHash = await bcrypt.hash(newPassword, 12);
        updateUserPassword(user.id, passwordHash);
        clearPasswordResetToken(user.id);
        res.json({ message: "Password updated successfully. You can now sign in." });
    }
    catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ error: "Could not reset password. Please try again." });
    }
});
// POST /auth/logout
router.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: "Could not log out." });
            return;
        }
        res.clearCookie("mw.sid");
        res.json({ message: "Logged out successfully." });
    });
});
// GET /auth/me
router.get("/auth/me", (req, res) => {
    if (!req.session.userId) {
        res.status(401).json({ error: "Not authenticated." });
        return;
    }
    const user = findUserById(String(req.session.userId));
    if (!user) {
        res.status(401).json({ error: "Not authenticated." });
        return;
    }
    res.json({ id: user.id, email: user.email });
});
export default router;
