const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const OPENCODE_MODELS_URL = "https://opencode.ai/zen/v1/models";

export interface ModelInfo {
  id: string;
  name: string;
  provider: "openrouter" | "opencode";
  pricing?: { prompt: string; completion: string };
  context_length?: number;
}

let cachedOpenRouter: ModelInfo[] | null = null;
let cachedOpenCode: ModelInfo[] | null = null;

export const modelService = {
  async fetchOpenRouterModels(apiKey?: string): Promise<ModelInfo[]> {
    if (cachedOpenRouter) return cachedOpenRouter;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      const res = await fetch(OPENROUTER_MODELS_URL, { headers });
      if (!res.ok) throw new Error(`OpenRouter API: ${res.status}`);
      const json = await res.json();
      const models: ModelInfo[] = (json.data || json)
        .filter((m: any) => m.id && !m.id.includes("image") && !m.id.includes("audio"))
        .map((m: any) => ({
          id: m.id,
          name: m.name || m.id,
          provider: "openrouter" as const,
          pricing: m.pricing,
          context_length: m.context_length || m.max_context_length,
        }));
      cachedOpenRouter = models;
      return models;
    } catch (e) {
      console.warn("[modelService] Failed to fetch OpenRouter models:", e);
      return [];
    }
  },

  async fetchOpenCodeModels(): Promise<ModelInfo[]> {
    if (cachedOpenCode) return cachedOpenCode;
    try {
      const res = await fetch(OPENCODE_MODELS_URL);
      if (!res.ok) throw new Error(`OpenCode API: ${res.status}`);
      const json = await res.json();
      const models: ModelInfo[] = (json.data || [])
        .filter((m: any) => m.id && m.id !== "big-pickle")
        .map((m: any) => ({
          id: m.id,
          name: m.id.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          provider: "opencode" as const,
        }));
      cachedOpenCode = models;
      return models;
    } catch (e) {
      console.warn("[modelService] Failed to fetch OpenCode models:", e);
      return [];
    }
  },

  async fetchAll(openRouterKey?: string): Promise<{
    openrouter: ModelInfo[];
    opencode: ModelInfo[];
  }> {
    const [orModels, ocModels] = await Promise.all([
      this.fetchOpenRouterModels(openRouterKey),
      this.fetchOpenCodeModels(),
    ]);
    return { openrouter: orModels, opencode: ocModels };
  },

  clearCache() {
    cachedOpenRouter = null;
    cachedOpenCode = null;
  },
};
