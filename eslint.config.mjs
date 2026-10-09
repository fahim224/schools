import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone prototypes and one-off maintenance scripts are not part of
    // the Next.js application lint target.
    "natayej-sms/**",
    "natayej-sms-10-11/**",
    "shoqa/**",
    "check-*.js",
    "simulate-register.js",
    "test-*.js",
    "test-*.ts",
  ]),
]);

export default eslintConfig;
