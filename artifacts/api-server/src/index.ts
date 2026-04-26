import "dotenv/config";
import app from "./app.js";

const port = Number(process.env["PORT"] || 5175);
const jsonDbPath = process.env.JSON_DB_PATH || "./data/db.json";
const frontendUrl = process.env.FRONTEND_URL || "not configured";

if (process.env.NODE_ENV === "production") {
  if (!process.env.JSON_DB_PATH) {
    console.warn(
      "WARNING: JSON_DB_PATH is not configured. Render filesystem is ephemeral unless you mount persistent storage. " +
      "Set JSON_DB_PATH=/data/db.json and mount a disk at /data if you want stable persistence."
    );
  }
  if (!process.env.FRONTEND_URL) {
    console.warn(
      "WARNING: FRONTEND_URL is not configured. Set FRONTEND_URL to the Vercel frontend URL, e.g. https://your-app.vercel.app"
    );
  }
}

const server = app.listen(port);

server.on('listening', () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Frontend origin: ${frontendUrl}`);
  console.log(`JSON DB path: ${jsonDbPath}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please choose a different port or kill the process using it.`);
    console.error(`You can run: netstat -ano | findstr :${port} to find the PID, then taskkill /PID <PID> /F to kill it.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
