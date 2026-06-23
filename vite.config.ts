import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/**
 * DARLEK CANN v3.0 - Build Orchestrator
 * Architecture: Vite + React + Tailwind + Agent-Core Integration
 * Integration: Siphoned from Sovereign-Kernel & SN-OMEGA patterns.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isAgentMode = env.DISABLE_HMR === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@types': path.resolve(__dirname, './src/types'),
        '@core': path.resolve(__dirname, './src/core'),
        '@agents': path.resolve(__dirname, './src/agents'),
      },
    },
    server: {
      hmr: !isAgentMode,
      watch: isAgentMode ? undefined : { usePolling: true, interval: 100 },
      port: parseInt(env.PORT || '3000', 10),
      strictPort: true,
      cors: true,
    },
    build: {
      sourcemap: mode !== 'production',
      minify: 'esbuild',
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) return 'vendor';
            if (id.includes('src/core')) return 'agent-core';
            if (id.includes('src/agents')) return 'agent-swarm';
          },
        },
      },
      reportCompressedSize: false,
      cssCodeSplit: true,
    },
    define: {
      '__BUILD_TIMESTAMP__': JSON.stringify(new Date().toISOString()),
      '__AGENT_CORE_VERSION__': JSON.stringify(process.env.npm_package_version || '3.0.0'),
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
      exclude: ['@core/heavy-compute-worker'],
    },
  };
});