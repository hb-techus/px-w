import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import eslint from 'vite-plugin-eslint';

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, 'environments');
  const env = loadEnv(mode, envDir, 'VITE_'); // only loads variables starting with VITE_

  return {
    base: './',
    plugins: [
      react({
        babel: {
          presets: ['@babel/preset-react'],
        },
      }),
      eslint({
        emitWarning: true,
        emitError: true,
        failOnWarning: false,
        failOnError: false,
        include: ['src/**/*.js', 'src/**/*.jsx'],
        exclude: ['node_modules', 'dist'],
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.[jt]sx?$/,
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
      exclude: ["some-heavy-lib"],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    define: {
      'process.env': env,
      global: 'globalThis',
    },
    css: {
      postcss: './postcss.config.js',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split based on specific directories, submodules, or packages
            if (id.includes('node_modules/@univerjs')) {
              // Split univerjs by different submodules or even by features
              const packageName = id.split('node_modules/')[1].split('/')[1];
              if (packageName) {
                return `univer-${packageName}`;
              }
            }

            if (id.includes('src/components')) return 'components';
            if (id.includes('src/utils')) return 'utils';
            if (id.includes('node_modules')) {
              const packageName = id.split('node_modules/')[1].split('/')[0];
              return `vendor-${packageName}`;
            }
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          // target: "http://localhost:3000",
          target: process.env.VITE_REACT_APP_API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
      },
      overlay: { warnings: true, errors: true },
    },
  };
});
