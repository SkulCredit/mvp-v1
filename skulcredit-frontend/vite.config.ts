import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const apiTarget = env.VITE_DEV_API_TARGET || "http://localhost:8080";
  const hmrHost = env.VITE_HMR_HOST || "localhost";
  const hmrPort = Number(env.VITE_HMR_PORT || 5173);

  return {
    plugins: [react()],
    optimizeDeps: {
      // Pre-bundle lodash so Vite converts it from CJS to ESM before the build step
      include: ["lodash"],
    },
    resolve: {
      alias: {
        // recharts imports lodash subpaths but the lodash installation is a partial bundle
        // that is missing internal helper files. Redirect all lodash subpath imports used
        // by recharts to per-function shims that delegate to the main lodash.js bundle.
        "lodash/every":         path.resolve(__dirname, "src/vendor/lodash-every.js"),
        "lodash/find":          path.resolve(__dirname, "src/vendor/lodash-find.js"),
        "lodash/first":         path.resolve(__dirname, "src/vendor/lodash-first.js"),
        "lodash/flatMap":       path.resolve(__dirname, "src/vendor/lodash-flatmap.js"),
        "lodash/get":           path.resolve(__dirname, "src/vendor/lodash-get.js"),
        "lodash/isBoolean":     path.resolve(__dirname, "src/vendor/lodash-isboolean.js"),
        "lodash/isEqual":       path.resolve(__dirname, "src/vendor/lodash-isequal.js"),
        "lodash/isFunction":    path.resolve(__dirname, "src/vendor/lodash-isfunction.js"),
        "lodash/isNaN":         path.resolve(__dirname, "src/vendor/lodash-isnan.js"),
        "lodash/isNil":         path.resolve(__dirname, "src/vendor/lodash-isnil.js"),
        "lodash/isNumber":      path.resolve(__dirname, "src/vendor/lodash-isnumber.js"),
        "lodash/isObject":      path.resolve(__dirname, "src/vendor/lodash-isobject.js"),
        "lodash/isPlainObject": path.resolve(__dirname, "src/vendor/lodash-isplainobject.js"),
        "lodash/isString":      path.resolve(__dirname, "src/vendor/lodash-isstring.js"),
        "lodash/last":          path.resolve(__dirname, "src/vendor/lodash-last.js"),
        "lodash/mapValues":     path.resolve(__dirname, "src/vendor/lodash-mapvalues.js"),
        "lodash/max":           path.resolve(__dirname, "src/vendor/lodash-max.js"),
        "lodash/maxBy":         path.resolve(__dirname, "src/vendor/lodash-maxby.js"),
        "lodash/memoize":       path.resolve(__dirname, "src/vendor/lodash-memoize.js"),
        "lodash/min":           path.resolve(__dirname, "src/vendor/lodash-min.js"),
        "lodash/minBy":         path.resolve(__dirname, "src/vendor/lodash-minby.js"),
        "lodash/omit":          path.resolve(__dirname, "src/vendor/lodash-omit.js"),
        "lodash/range":         path.resolve(__dirname, "src/vendor/lodash-range.js"),
        "lodash/some":          path.resolve(__dirname, "src/vendor/lodash-some.js"),
        "lodash/sortBy":        path.resolve(__dirname, "src/vendor/lodash-sortby.js"),
        "lodash/sumBy":         path.resolve(__dirname, "src/vendor/lodash-sumby.js"),
        "lodash/throttle":      path.resolve(__dirname, "src/vendor/lodash-throttle.js"),
        "lodash/uniqBy":        path.resolve(__dirname, "src/vendor/lodash-uniqby.js"),
        "lodash/upperFirst":    path.resolve(__dirname, "src/vendor/lodash-upperfirst.js"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      watch: {
        usePolling: true,
        interval: 300,
      },
      hmr: {
        host: hmrHost,
        port: hmrPort,
        protocol: "ws",
      },
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/uploads": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
