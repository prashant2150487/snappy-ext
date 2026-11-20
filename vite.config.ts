import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url';
const p = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig(({ mode }) => {
  const contentBuild = mode === 'content';
  const input: Record<string, string> = contentBuild
    ? { content: p('./src/content/index.tsx') }
    : {
        app: p('./index.html'),
        background: p('./src/background/service-worker.ts'),
      };

  return {
    plugins: [react()],
    publicDir: "public",
    build: {
      emptyOutDir: !contentBuild,
      rollupOptions: {
        input,
        output: {
          entryFileNames: "[name].js",
          ...(contentBuild ? { format: 'iife' as const } : {}),
        },
      },
    },
  };
});
