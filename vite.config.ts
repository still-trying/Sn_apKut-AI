// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    envPrefix: ["VITE_", "SUPABASE_"],
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              strictExecutionOrder: true,
              codeSplitting: {
                minSize: 0,
                groups: [
                  {
                    name: "vendor-react",
                    test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                    priority: 50,
                    includeDependenciesRecursively: false,
                  },
                  {
                    name: "vendor-tanstack",
                    test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
                    priority: 40,
                    includeDependenciesRecursively: false,
                  },
                  {
                    name: "vendor-supabase",
                    test: /[\\/]node_modules[\\/]@supabase[\\/]/,
                    priority: 30,
                    includeDependenciesRecursively: false,
                  },
                  {
                    name: "vendor-radix",
                    test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                    priority: 20,
                    includeDependenciesRecursively: false,
                  },
                  {
                    name: "vendor-charts",
                    test: /[\\/]node_modules[\\/](recharts|d3-.*|victory-vendor)[\\/]/,
                    priority: 15,
                    includeDependenciesRecursively: false,
                  },
                  {
                    name: "vendor-ui",
                    test: /[\\/]node_modules[\\/](lucide-react|sonner|zod|date-fns|clsx|tailwind-merge|class-variance-authority)[\\/]/,
                    priority: 10,
                    includeDependenciesRecursively: false,
                  },
                  {
                    name: "vendor-common",
                    test: /[\\/]node_modules[\\/]/,
                    priority: 5,
                    includeDependenciesRecursively: false,
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
