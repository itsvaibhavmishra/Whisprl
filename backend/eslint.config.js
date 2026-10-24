import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    rules: {
      "no-unused-vars": ["error", { ignoreRestSiblings: true, argsIgnorePattern: "^_$" }],
      "no-restricted-imports": ["error", { patterns: [{ group: ["./*", "../*"], message: "Import project files through # instead." }] }],
      "id-length": ["error", { min: 2, exceptions: ["_"], properties: "never" }],
    },
  },
  prettier,
];
