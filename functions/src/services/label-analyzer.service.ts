import { DietaryFlag, Food, FoodStatus } from "@aicoach/shared";
import { storage } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import aiService, { AiModelConfig } from "./ai.service";
import foodService from "./food.service";

export type LabelAnalysis = Pick<Food, "brand" | "name" | "category" | "nutritions" | "variation"> & {
	dietaryFlags: DietaryFlag[];
	isValidProductImage: boolean;
};

export interface LabelAnalysisInput {
	bucket: string;
	labelPath: string;
	packagePath: string;
}

interface PathInfo {
	uid: string;
	foodId: string;
}

interface ImageData {
	labelDataUri: string;
	packageDataUri: string;
}

export class LabelAnalyzerService {
	async analyzeLabel(input: LabelAnalysisInput): Promise<void> {
		logger.log("Analyzing label with input", { input });

		try {
			const pathInfo = this.extractPathInfo(input.labelPath);
			if (!pathInfo) return;

			const foodDoc = await this.getFoodDocument(pathInfo.uid, pathInfo.foodId);
			if (!foodDoc || foodDoc.status !== FoodStatus.Creating) return;

			await foodService.setFoodDocumentStatus(pathInfo.uid, pathInfo.foodId, FoodStatus.Analyzing);

			const imageData = await this.getImageDataForAnalysis(input);
			if (!imageData) return;

			const analysisResult = await this.getAnalysisResult(imageData);
			if (!analysisResult) return;

			if (!analysisResult.isValidProductImage) {
				await foodService.updateUserFoodDocument(pathInfo.uid, pathInfo.foodId, {
					status: FoodStatus.Invalid
				});

				return;
			}

			logger.log(`Successfully analyzed and updated food document for ${pathInfo.foodId}`);
			await foodService.updateUserFoodDocument(pathInfo.uid, pathInfo.foodId, {
				name: analysisResult.name,
				brand: analysisResult.brand,
				category: analysisResult.category,
				nutritions: analysisResult.nutritions,
				dietaryFlags: analysisResult.dietaryFlags,
				lastUpdatedAt: FieldValue.serverTimestamp(),
				status: FoodStatus.Prefilled,
				images: [
					{
						type: "label",
						url: input.labelPath
					},
					{
						type: "package",
						url: input.packagePath
					}
				]
			});
		} catch (error) {
			logger.error("Error analyzing label:", error);
		}
	}

	private extractPathInfo(path: string): PathInfo | null {
		const pathParts = path.split("/");
		if (pathParts.length < 4) {
			logger.error("Invalid file path format", path);
			return null;
		}

		return {
			uid: pathParts[1],
			foodId: pathParts[2]
		};
	}

	private async getFoodDocument(uid: string, foodId: string) {
		const foodDoc = await foodService.getUserFoodDocument(uid, foodId);
		if (!foodDoc) {
			logger.error(`Food document not found for user ${uid} and food ${foodId}`);
			return null;
		}
		return foodDoc;
	}

	private async getImageDataForAnalysis(input: LabelAnalysisInput): Promise<ImageData | null> {
		try {
			const bucket = storage().bucket(input.bucket);

			const labelFile = bucket.file(input.labelPath);
			const packageFile = bucket.file(input.packagePath);

			const [labelContent] = await labelFile.download();
			const [packageContent] = await packageFile.download();

			const [labelMetadata] = await labelFile.getMetadata();
			const [packageMetadata] = await packageFile.getMetadata();

			const labelMimeType = labelMetadata.contentType || "image/jpeg";
			const packageMimeType = packageMetadata.contentType || "image/jpeg";

			const labelBase64 = labelContent.toString("base64");
			const packageBase64 = packageContent.toString("base64");

			return {
				labelDataUri: `data:${labelMimeType};base64,${labelBase64}`,
				packageDataUri: `data:${packageMimeType};base64,${packageBase64}`
			};
		} catch (error) {
			logger.error("Error downloading images:", error);
			return null;
		}
	}

	private async getAnalysisResult(imageData: ImageData): Promise<LabelAnalysis | undefined> {
		const modelConfig: AiModelConfig = {
			model: "gpt-4o",
			temperature: 0.5,
			maxTokens: 700
		};
		const result = await aiService.analyzeProductImages(imageData.packageDataUri, imageData.labelDataUri, modelConfig);
		if (!result) {
			logger.error("Failed to analyze product images");
			return;
		}

		return result;
	}
}

export default new LabelAnalyzerService();
