import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

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
      },
    },
    server: {
      hmr: !isAgentMode,
      watch: isAgentMode ? null : { usePolling: true },
      port: 3000,
      strictPort: true,
    },
    build: {
      sourcemap: mode !== 'production',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },
    define: {
      'process.env.BUILD_VERSION': JSON.stringify(process.env.npm_package_version),
      'process.env.AGENT_CORE_ID': JSON.stringify('DARLEK-CANN-V3-CORE'),
    },
  };
});