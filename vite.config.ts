// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Use static preset for Capacitor mobile builds - this creates a client-side only build
    preset: 'static',
    // Generate the real SPA shell (_shell.html). Capacitor needs this server-rendered
    // document because the TanStack client bundle calls hydrateRoot(document, ...).
    // Without it the WebView has nothing to hydrate and shows an empty white page.
    spa: { enabled: true },
  },
  vite: {
    // Capacitor mobile build optimization
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      // Ensure proper chunking for mobile
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split vendor chunks for better caching
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('@tanstack')) {
                return 'vendor-tanstack';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              return 'vendor';
            }
            return undefined;
          }
        }
      }
    },
    server: {
      port: 3000,
      host: true
    },
    // Define environment variables for the mobile app
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify('https://feitxy.lovable.app'),
    }
  }
});
