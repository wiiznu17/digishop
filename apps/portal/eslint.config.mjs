import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import prettierPlugin from 'eslint-plugin-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log("__dirname:", __dirname);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
    ],
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
    rules: {
      'prettier/prettier': [
        'error', 
        {endOfLine: 'auto'}
      ]
    }
  }),
  {
    plugins: {
      prettier: prettierPlugin
    }
  }
];

export default eslintConfig;
