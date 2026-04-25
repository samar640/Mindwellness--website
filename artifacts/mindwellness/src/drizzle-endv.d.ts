/// <reference types="vite/client" />
/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    SESSION_SECRET?: string;
    PORT?: string;
    BASE_PATH?: string;
  }
}