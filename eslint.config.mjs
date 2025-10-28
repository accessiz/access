import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Extiende la configuración de Next.js y TypeScript
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Ignora archivos y carpetas globalmente
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/lib/db-types.ts", // tu archivo binario
      "scripts/**",          // tu carpeta de scripts
    ],
  },
];

export default eslintConfig;
