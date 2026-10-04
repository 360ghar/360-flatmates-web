import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = tseslint.config(
  ...tseslint.configs.recommended,
  { files: ["src/**/*.tsx"], ...jsxA11y.flatConfigs.recommended },
  {
    files: ["src/**/*.tsx"],
    rules: {
      // Our inputs are components; labels wrap them.
      "jsx-a11y/label-has-associated-control": ["error", { controlComponents: ["Input", "PasswordInput", "PhoneInput", "SelectField", "Textarea"], depth: 3 }],
      // Single-purpose steps (OTP, password, inline rename) focus their only field on purpose.
      "jsx-a11y/no-autofocus": "off"
    }
  },
  {
    plugins: {
      "react-hooks": reactHooks,
      react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "error",
      "react/react-in-jsx-scope": "off",
    }
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".next/**",
      ".agents/**",
      ".claude/**",
      ".factory/**",
      "playwright-report/**",
      "test-results/**",
      "src/lib/api/openapi-types.ts",
      "tsconfig.tsbuildinfo"
    ]
  },
  // Layers (CLAUDE.md "Project structure"): app -> features -> shared.
  {
    files: ["src/components/**", "src/hooks/**", "src/lib/**"],
    ignores: ["**/__tests__/**", "**/*.test.*"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ group: ["@/features/**", "@/app/**"], message: "Shared code must not depend on a feature or the app layer." }]
      }]
    }
  },
  {
    files: ["src/features/**"],
    ignores: ["**/__tests__/**", "**/*.test.*"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["@/app/**"], message: "Features must not depend on the app layer." },
          { group: ["@/features/*/pages/**"], message: "Only the router imports pages; share a component instead." }
        ]
      }]
    }
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-namespace": "off",
    }
  }
);

export default eslintConfig;
