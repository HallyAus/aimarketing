import { z } from "zod";

/** Schema for required environment variables */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
  REDIS_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  MASTER_ENCRYPTION_KEY: z.string().min(1, "MASTER_ENCRYPTION_KEY is required").optional(),
});

/**
 * Validate environment variables at startup.
 * Call this in your server entry point to fail fast on misconfiguration.
 */
export function validateEnv(env: Record<string, string | undefined> = process.env as Record<string, string | undefined>): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  // In production, ensure MASTER_ENCRYPTION_KEY is not all-zeros
  if (env.NODE_ENV === "production" && result.data.MASTER_ENCRYPTION_KEY) {
    const allZeros = /^0+$/.test(result.data.MASTER_ENCRYPTION_KEY);
    if (allZeros) {
      throw new Error(
        "MASTER_ENCRYPTION_KEY must not be all-zeros in production. Generate a proper key with: openssl rand -hex 32"
      );
    }
  }

  return result.data;
}
