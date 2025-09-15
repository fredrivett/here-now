import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

export default [
  // Apply to TypeScript and JavaScript files
  {
    files: ["**/*.{ts,js}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // General code quality
      "no-console": "off", // Allow console.log for server logging
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: "error",

      // Import/export
      "no-duplicate-imports": "error",
    },
  },

  // Ignore certain files
  {
    ignores: ["node_modules/**", "dist/**", "**/*.js.map", ".env*"],
  },
];
