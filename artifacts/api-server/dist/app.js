import express from "express";
import cors from "cors";
import session from "express-session";
import router from "./routes";
const app = express();
// CORS — allow credentials for session cookies
app.use(cors({
    origin: [
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
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
