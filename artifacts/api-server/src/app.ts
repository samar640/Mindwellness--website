import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import router from "./routes";

const app: Express = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_ALT,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean) as string[];

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

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  const message = "SESSION_SECRET is required for secure session cookies.";
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${message} Set SESSION_SECRET in Render environment settings.`);
  }
  console.warn(`${message} Falling back to an insecure development secret.`);
}

// Session middleware
app.use(session({
  name: "mw.sid",
  secret: sessionSecret || "dev-session-secret",
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
