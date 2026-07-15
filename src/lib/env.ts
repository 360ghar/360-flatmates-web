import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.url(),
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  VITE_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Missing or invalid environment variables:\n${issues}\n\nCheck your .env.local file.`
    );
  }

  _env = result.data;
  return _env;
}

export function validateEnv(): void {
  getEnv();
}
