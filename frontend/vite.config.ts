import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load ALL env variables for the current mode (not just VITE_* ones).
  // The empty-string prefix means server-side variables like BACKEND_URL
  // are also available here, but they are never injected into the browser bundle.
  const env = loadEnv(mode, process.cwd(), '');

  const backendUrl = env.BACKEND_URL || 'http://localhost:8080';
  const devPort    = Number(env.VITE_DEV_PORT) || 5173;

  return {
    plugins: [react()],
    server: {
      port: devPort,
      proxy: {
        // All /api/* calls are forwarded to the Spring Boot backend.
        // In development this avoids CORS; in production the app is
        // built statically and served separately, so the proxy is unused.
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          // Log every proxied request to the Vite terminal for easy debugging.
          configure: (proxy) => {
            proxy.on('error',    (err)       => console.error('[proxy] error', err.message));
            proxy.on('proxyReq', (_req, req) => console.log(`[proxy] ${req.method} ${req.url}`));
          },
        },
      },
    },
  };
});
