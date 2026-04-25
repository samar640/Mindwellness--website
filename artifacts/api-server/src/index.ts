import "dotenv/config";
import app from "./app";

const port = Number(process.env["PORT"] || 5175);

const server = app.listen(port);

server.on('listening', () => {
  console.log(`Server listening on port ${port}`);
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
