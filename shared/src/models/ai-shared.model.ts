export const aiModels = ["gpt-4o", "claude-3-7-sonnet-latest"] as const;
export type AiModel = (typeof aiModels)[number];
