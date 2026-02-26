import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  ALERT_TO_EMAIL: z.string().optional(),
  ALIEXPRESS_API_BASE_URL: z.string().url().optional(),
  ALIEXPRESS_APP_KEY: z.string().optional(),
  ALIEXPRESS_APP_SECRET: z.string().optional(),
  US_WHOLESALER_API_BASE_URL: z.string().url().optional(),
  US_WHOLESALER_API_KEY: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

function emptyToUndefined(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function optionalNumberFromEnv(value: string | undefined) {
  const normalized = emptyToUndefined(value);
  if (!normalized) {
    return undefined;
  }

  return Number(normalized);
}

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    STRIPE_SECRET_KEY: emptyToUndefined(process.env.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: emptyToUndefined(process.env.STRIPE_WEBHOOK_SECRET),
    STRIPE_PUBLISHABLE_KEY: emptyToUndefined(process.env.STRIPE_PUBLISHABLE_KEY),
    SMTP_HOST: emptyToUndefined(process.env.SMTP_HOST),
    SMTP_PORT: optionalNumberFromEnv(process.env.SMTP_PORT),
    SMTP_USER: emptyToUndefined(process.env.SMTP_USER),
    SMTP_PASS: emptyToUndefined(process.env.SMTP_PASS),
    SMTP_FROM: emptyToUndefined(process.env.SMTP_FROM),
    ALERT_TO_EMAIL: emptyToUndefined(process.env.ALERT_TO_EMAIL),
    ALIEXPRESS_API_BASE_URL: emptyToUndefined(process.env.ALIEXPRESS_API_BASE_URL),
    ALIEXPRESS_APP_KEY: emptyToUndefined(process.env.ALIEXPRESS_APP_KEY),
    ALIEXPRESS_APP_SECRET: emptyToUndefined(process.env.ALIEXPRESS_APP_SECRET),
    US_WHOLESALER_API_BASE_URL: emptyToUndefined(process.env.US_WHOLESALER_API_BASE_URL),
    US_WHOLESALER_API_KEY: emptyToUndefined(process.env.US_WHOLESALER_API_KEY),
  });

  return cachedEnv;
}
