import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  { ignores: ["build", "android"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["error", { ignoreRestSiblings: true, argsIgnorePattern: "^_$" }],
      "no-restricted-imports": ["error", { patterns: [{ group: ["./*", "../*"], message: "Import project files through @/ instead." }] }],
      "id-length": ["error", { min: 2, exceptions: ["_"], properties: "never" }],
    },
  },
  {
    files: ["**/*.test.{js,jsx}"],
    languageOptions: { globals: { ...globals.vitest, ...globals.node } },
  },
  {
    files: ["*.config.mjs"],
    languageOptions: { globals: globals.node },
  },
  prettier,
];
