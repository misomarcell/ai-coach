import { AnalysisPreferences, CalorieVisionResult } from "@aicoach/shared";
import { AiModel } from "@aicoach/shared/models/ai-shared.model";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import {
	DietaryAnalysis,
	FoodPictureAnalysis,
	ProductImageAnalysis,
	SYSTEM_CALORIE_VISION_PROMPT,
	SYSTEM_DIET_ANALYSIS_PROMPT,
	SYSTEM_PRODUCT_IMAGE_PROMPT
} from "../const/ai-service.const";
import { AnalysisResultBase } from "../models/ai-service.model";
import { buildPreferences } from "../utils/prompt-builder.util";
import { LabelAnalysis } from "./label-analyzer.service";

export type AiModelConfig = {
	model?: AiModel;
	maxTokens?: number;
	temperature?: number;
};

const DEFAULT_MODEL: AiModel = "gpt-4o";
const DEFAULT_MAX_TOKENS = 1000;
const DEFAULT_TEMPERATURE = 0.7;
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

export class AiService {
	async getAnalysisResult(servings: string, preferences: AnalysisPreferences, config: AiModelConfig): Promise<AnalysisResultBase | null> {
		if (!servings) {
			logger.error("Servings content could not be retrieved");

			throw new Error("Servings content could not be retrieved");
		}

		const model = this.getModelInstance(config);
		const prompt = ChatPromptTemplate.fromMessages([
			["developer", SYSTEM_DIET_ANALYSIS_PROMPT],
			["user", "{compiledPreferences}"],
			["assistant", "{servings}"]
		]);

		const compiledPreferences = buildPreferences(preferences);
		const structuredLlm = model.withStructuredOutput(DietaryAnalysis, { name: "dietary-suggestion" });
		const parsedResponse = await prompt.pipe(structuredLlm).invoke({ compiledPreferences, servings });

		return { ...parsedResponse, model: model.getName() };
	}

	async getPromptResult(prompt: string, data: string): Promise<string | null> {
		const model = this.getModelInstance();
		const promptTemplate = ChatPromptTemplate.fromMessages([
			["system", prompt],
			["human", "{data}"]
		]);

		const response = await promptTemplate.pipe(model).invoke({ data });

		return response.text;
	}

	async analyzeVisionImage(imageData: string, description?: string): Promise<CalorieVisionResult | null> {
		const model = this.getModelInstance();
		const prompt = ChatPromptTemplate.fromMessages([
			["system", SYSTEM_CALORIE_VISION_PROMPT],
			[
				"user",
				[
					{ type: "text", text: description },
					{ type: "image_url", image_url: { url: imageData } }
				]
			]
		]);

		const structuredLlm = model.withStructuredOutput(FoodPictureAnalysis, { name: "food-picture-analysis" });
		const parsedResponse = await prompt.pipe(structuredLlm).invoke({ description });

		return parsedResponse;
	}

	async analyzeProductImages(packageImageData: string, labelImageData: string, config: AiModelConfig): Promise<LabelAnalysis | null> {
		logger.info("Sending image to OpenAI for product package analysis");

		const model = this.getModelInstance(config);
		const prompt = ChatPromptTemplate.fromMessages([
			["system", SYSTEM_PRODUCT_IMAGE_PROMPT],
			[
				"human",
				[
					{ type: "image_url", image_url: { url: packageImageData } },
					{ type: "image_url", image_url: { url: labelImageData } }
				]
			]
		]);

		const structuredLlm = model.withStructuredOutput(ProductImageAnalysis, {
			name: "product-package-analysis"
		});

		try {
			return prompt.pipe(structuredLlm).invoke({});
		} catch (error) {
			logger.error("Error analyzing image with OpenAI vision:", error);
			return null;
		}
	}

	private getModelInstance(config?: AiModelConfig) {
		let apiKey: string;
		switch (config?.model) {
			case "claude-3-7-sonnet-latest":
				apiKey = ANTHROPIC_API_KEY.value();
				break;
			case "gpt-4o":
				apiKey = OPENAI_API_KEY.value();
				break;
			default:
				apiKey = OPENAI_API_KEY.value();
		}

		return new ChatOpenAI({
			apiKey,
			model: config?.model || DEFAULT_MODEL,
			maxTokens: config?.maxTokens || DEFAULT_MAX_TOKENS,
			temperature: config?.temperature || DEFAULT_TEMPERATURE
		});
	}
}

export default new AiService();
