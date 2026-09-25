import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // The app is always served from /mc/app/ on the processor. Emitting absolute asset URLs avoids a
  // race between Vite's preload scanner and the dynamic <base> tag in index.html, which otherwise
  // 404s bundle assets on nested routes and leaves the panel blank.
  base: '/mc/app/',
  plugins: [react()],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 still uses Sass APIs that modern Sass deprecates. Nothing to fix on our
        // side; silence the hundreds of warnings the import produces.
        api: 'modern-compiler',
        silenceDeprecations: ['import', 'color-functions', 'global-builtin', 'if-function'],
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    open: true,
  },
});
