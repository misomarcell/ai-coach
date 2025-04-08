import { CalorieVisionDb, CalorieVisionStatus } from "@aicoach/shared";
import { firestore, storage } from "firebase-admin";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { StorageObjectData } from "firebase-functions/storage";
import visionService from "../services/vision.service";
import aiService from "./ai.service";

export class VisionService {
	async processVisionUpload(filePath: string, data: StorageObjectData) {
		try {
			logger.info(`Processing vision file upload: ${filePath}`);

			const pathParts = filePath.split("/");
			if (pathParts.length < 3) {
				logger.error(`Invalid file path structure: ${filePath}`);
				return;
			}

			const userId = pathParts[1];
			const fileName = pathParts[2];

			const bucket = storage().bucket(data.bucket);
			const file = bucket.file(filePath);

			const [metadata] = await file.getMetadata({});
			const mimeType = metadata.contentType || "image/jpeg";
			const description = `${metadata.metadata?.description}` !== "null" ? `${metadata.metadata?.description}` : undefined;

			const docRef = await visionService.createVisionDocument(userId, {
				status: CalorieVisionStatus.Processing,
				fileName,
				description
			});

			const [fileContent] = await file.download();
			const base64Image = fileContent.toString("base64");
			const dataUri = `data:${mimeType};base64,${base64Image}`;

			const result = await aiService
				.analyzeVisionImage(dataUri, `${description}`)
				.catch((error) => this.handleError(error, userId, docRef.id));

			if (!result) {
				logger.error("Failed to get response from OpenAI Vision API");
				return;
			}

			await visionService.updateVisionDocument(userId, docRef.id, { status: CalorieVisionStatus.Complete, result });

			logger.info(`Vision analysis completed and saved to Firestore with ID: ${docRef.id}`);
		} catch (error) {
			await this.handleError(error);
		}
	}

	async createVisionDocument(userId: string, content: Partial<CalorieVisionDb>): Promise<DocumentReference> {
		const docRef = firestore().collection(`users/${userId}/calorie-vision`).doc();

		await docRef.set({
			id: docRef.id,
			created: FieldValue.serverTimestamp(),
			...content
		} as CalorieVisionDb);

		return docRef;
	}

	async updateVisionDocument(userId: string, visionId: string, content: Partial<CalorieVisionDb>): Promise<DocumentReference> {
		const docRef = firestore().collection(`users/${userId}/calorie-vision`).doc(visionId);

		await docRef.set(content, { merge: true });

		return docRef;
	}

	async getVisionDocument(userId: string, visionId: string): Promise<CalorieVisionDb | undefined> {
		const docRef = firestore().collection(`users/${userId}/calorie-vision`).doc(visionId);

		const doc = await docRef.get();
		if (!doc.exists) return;

		return doc.data() as CalorieVisionDb;
	}

	private async handleError(error: unknown, userId?: string, documentId?: string) {
		logger.error("Error processing vision upload:", error);

		if (userId && documentId) {
			await this.updateVisionDocument(userId, documentId, { status: CalorieVisionStatus.Error });
		}
	}
}

export default new VisionService();
