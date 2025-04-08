import { AnalysisResult } from "@aicoach/shared";

export type AnalysisResultBase = Omit<AnalysisResult, "created">;
