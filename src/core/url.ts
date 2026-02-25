import { getEnv } from "@/core/env";

export function absoluteUrl(path: string) {
  const base = getEnv().NEXT_PUBLIC_BASE_URL;
  return new URL(path, base).toString();
}
