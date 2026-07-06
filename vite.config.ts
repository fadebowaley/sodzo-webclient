import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@haloform/ui": path.resolve(
          __dirname,
          "../sabyFrontend/packages/isomorphic-core/src/components/haloform/ui"
        ),
        "@haloform/types": path.resolve(
          __dirname,
          "../sabyFrontend/packages/isomorphic-core/types"
        ),
        "@haloform/lib": path.resolve(
          __dirname,
          "../sabyFrontend/packages/isomorphic-core/src/components/haloform/lib"
        ),
        "@haloform/FormBuilder": path.resolve(
          __dirname,
          "../sabyFrontend/packages/isomorphic-core/src/components/haloform/FormBuilder"
        ),
        "@radix-ui/react-slot": path.resolve(
          __dirname,
          "node_modules/@radix-ui/react-slot"
        ),
        "@radix-ui/react-label": path.resolve(
          __dirname,
          "node_modules/@radix-ui/react-label"
        ),
        "@radix-ui/react-checkbox": path.resolve(
          __dirname,
          "node_modules/@radix-ui/react-checkbox"
        ),
        "@radix-ui/react-radio-group": path.resolve(
          __dirname,
          "node_modules/@radix-ui/react-radio-group"
        ),
        "@radix-ui/react-select": path.resolve(
          __dirname,
          "node_modules/@radix-ui/react-select"
        ),
        "@radix-ui/react-popover": path.resolve(
          __dirname,
          "node_modules/@radix-ui/react-popover"
        ),
        "@radix-ui/react-switch": path.resolve(
          __dirname,
          "node_modules/@radix-ui/react-switch"
        ),
        "@radix-ui/react-slider": path.resolve(
          __dirname,
          "node_modules/@radix-ui/react-slider"
        ),
        "class-variance-authority": path.resolve(
          __dirname,
          "node_modules/class-variance-authority"
        ),
        clsx: path.resolve(__dirname, "node_modules/clsx"),
        "tailwind-merge": path.resolve(__dirname, "node_modules/tailwind-merge"),
        "react-day-picker": path.resolve(__dirname, "node_modules/react-day-picker"),
        sonner: path.resolve(__dirname, "node_modules/sonner"),
        "date-fns": path.resolve(__dirname, "node_modules/date-fns"),
        "lucide-react": path.resolve(__dirname, "node_modules/lucide-react"),
      },
    },
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    server: {
      host: "0.0.0.0", // Listen on all network interfaces
      port: 5173,
      strictPort: false, // Allow port to be changed if 5173 is busy
      fs: {
        allow: [
          path.resolve(__dirname, "."),
          path.resolve(__dirname, "../sabyFrontend/packages/isomorphic-core"),
        ],
      },
      proxy: {
        // Proxy /v1 requests to the staging API during local development to avoid CORS
        "/v1": {
          target: env.VITE_API_PROXY_TARGET || "https://api.saby.ai",
          changeOrigin: true,
          secure: true, // Use true for HTTPS
          ws: false, // Disable WebSocket proxying
          timeout: 30000, // 30 second timeout
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.error("[Vite Proxy] Error:", err.message);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                "[Vite Proxy]",
                req.method,
                req.url,
                "→",
                proxyReq.path
              );
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log(
                "[Vite Proxy] Response:",
                proxyRes.statusCode,
                "for",
                req.url
              );
            });
          },
        },
      },
    },
  };
});
