import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dotenv from 'dotenv';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  dotenv.config({ path: `.env.${mode}` });
  dotenv.config({ path: `.env` });

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/oauth2': {
          target: 'https://oauth.livepix.gg',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/oauth2/, '/'),
          secure: false,
        },
        '/api': {
          target: 'https://api.livepix.gg',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
