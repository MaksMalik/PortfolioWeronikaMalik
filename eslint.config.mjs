import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreVitals,
  ...nextTypescript,
  {
    rules: {
      "@next/next/no-img-element": "off"
    }
  },
  globalIgnores([".next/**", "out/**", "next-env.d.ts"])
]);
