import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { "no-unused-vars": ["error", { ignoreRestSiblings: true }] },
  },
  {
    files: ["src/**/context/**"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    // Node scripts (run by hand or by npm, never in the browser).
    files: ["scripts/**/*.{js,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
    rules: { "no-unused-vars": ["error", { ignoreRestSiblings: true }] },
  },
  {
    // Netlify edge functions run on Deno.
    files: ["netlify/edge-functions/**/*.js"],
    languageOptions: { globals: { ...globals.browser, Deno: "readonly" } },
  },
]);
