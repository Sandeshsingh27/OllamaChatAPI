/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Empty in dev (proxy used); full URL in prod e.g. http://localhost:8080 */
  readonly VITE_API_BASE_URL: string;
  /** SSE streaming endpoint path, e.g. /api/chat/stream */
  readonly VITE_STREAM_ENDPOINT: string;
  /** Blocking chat endpoint path, e.g. /api/chat */
  readonly VITE_CHAT_ENDPOINT: string;
  /** Display title shown in the header */
  readonly VITE_APP_TITLE: string;
  /** Model name badge shown in the header */
  readonly VITE_MODEL_NAME: string;
  /** Dev-server port read by vite.config.ts (defaults to 5173) */
  readonly VITE_DEV_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
