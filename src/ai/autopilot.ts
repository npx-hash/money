import { getEnabledExtensions } from "@/ai/extension-registry";

export type AutopilotInput = {
  event: string;
  payload: Record<string, unknown>;
};

export function runAutopilot(input: AutopilotInput) {
  const matching = getEnabledExtensions().filter((extension) => extension.trigger === input.event);

  return matching.map((extension) => ({
    extensionId: extension.id,
    summary: `${extension.id} handled event ${input.event}`,
    payload: input.payload,
  }));
}
