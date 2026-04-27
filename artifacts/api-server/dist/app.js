import express from "express";
import cors from "cors";
import session from "express-session";
import router from "./routes";
const app = express();
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_ALT,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://mindwellness-weblove-hw53q9830-samrattiwari038-8580s-projects.vercel.app",
].filter(Boolean);
// CORS — allow credentials for session cookies
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session middleware
app.use(session({
    name: "mw.sid",
    secret: process.env.SESSION_SECRET || "mindwellness-secret-key-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
}));
app.use("/api", router);
export default app;
