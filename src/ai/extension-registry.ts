export type AIExtension = {
  id: string;
  description: string;
  trigger: string;
  enabled: boolean;
};

const extensionRegistry: AIExtension[] = [
  {
    id: "price-optimizer",
    description: "Suggests safe price experiments while enforcing margin floor",
    trigger: "daily_profit_report",
    enabled: true,
  },
  {
    id: "supplier-risk-monitor",
    description: "Detects delayed fulfillment and recommends supplier fallback",
    trigger: "tracking_sync",
    enabled: true,
  },
  {
    id: "creative-brief-generator",
    description: "Drafts ad angles using product margin and return-risk data",
    trigger: "campaign_planning",
    enabled: true,
  },
];

export function listExtensions() {
  return extensionRegistry;
}

export function getEnabledExtensions() {
  return extensionRegistry.filter((extension) => extension.enabled);
}
