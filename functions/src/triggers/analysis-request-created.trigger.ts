import { AnalysisDb, AnalysisPreferences, AnalysisRequestStatus } from "@aicoach/shared";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import analysisService from "../services/analysis.service";
import userService from "../services/user.service";
import aiService, { AiModelConfig } from "../services/ai.service";
import servingsService from "../services/servings.service";
import { formatServings } from "../utils/formatter.util";

export const analysisRequestCreated = onDocumentCreated(
	{
		document: "users/{userId}/analyses/{analysisId}",
		secrets: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
		memory: "1GiB",
		timeoutSeconds: 300,
		region: "europe-west1"
	},
	async (event) => {
		const snapshot = event.data;
		const userId = event.params.userId;
		const analysisId = event.params.analysisId;

		if (!snapshot) {
			logger.error("Analysis data not found");
			return;
		}

		const analysis = snapshot.data() as AnalysisDb;
		logger.info(`Processing analysis request ${analysisId} for user ${userId}`);

		try {
			const ongoinAnalyses = await analysisService.getAnalysesByStatus(userId, [
				AnalysisRequestStatus.Created,
				AnalysisRequestStatus.Processing
			]);
			if (ongoinAnalyses.filter((ongoing) => ongoing.id !== analysis.id)?.length > 0) {
				throw new Error("User has ongoing analysis");
			}

			await analysisService.updateAnalysisStatus(userId, analysisId, AnalysisRequestStatus.Processing);

			const userProfile = await userService.getUserProfile(userId);
			if (!userProfile.analysisPreferences) {
				throw new Error("User has no analysis preferences");
			}

			const now = new Date();
			const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			const preferences = userProfile.analysisPreferences as AnalysisPreferences;
			const servings = await servingsService.getUserServings(userId, { before: now, after: weekAgo });
			const formattedServings = await formatServings(servings);
			const modelConfig: AiModelConfig = { model: analysis.request.model };
			const analysisResult = await aiService.getAnalysisResult(formattedServings, preferences, modelConfig);
			if (!analysisResult) {
				throw new Error(`Failed to get analysis from ${analysis.request.model}`);
			}

			await analysisService.setAnalysisResult(userId, analysisId, analysisResult);
			await analysisService.updateAnalysisStatus(userId, analysisId, AnalysisRequestStatus.Completed);
			await analysisService.sendAnalysisResult(userId, analysisId);

			logger.info(`Analysis ${analysisId} completed successfully for user ${userId}`);
		} catch (error) {
			logger.error(`Error processing analysis for user ${userId}`, error);

			const errorMessage = error instanceof Error ? error.message : String(error);
			await analysisService.updateAnalysisStatus(userId, analysisId, AnalysisRequestStatus.Failed, errorMessage);
		}
	}
);
