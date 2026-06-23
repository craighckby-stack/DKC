import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/**
 * DARLEK CANN v3.0 - Build Orchestrator
 * Architecture: Vite + React + Tailwind + Agent-Core Integration
 * Purpose: High-performance transpilation for autonomous agent swarms.
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
          // Granular chunking for agent-core stability
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            if (id.includes('src/core')) {
              return 'agent-core';
            }
          },
        },
      },
      reportCompressedSize: false,
    },
    define: {
      'process.env.BUILD_VERSION': JSON.stringify(process.env.npm_package_version || '0.0.0'),
      'process.env.AGENT_CORE_ID': JSON.stringify('DARLEK-CANN-V3-CORE'),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@core/heavy-compute-worker'],
    },
  };
});