import { CalorieVisionDb, CalorieVisionStatus } from "@aicoach/shared";
import { firestore, storage } from "firebase-admin";
import { DocumentReference } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import visionService from "../services/vision.service";
import aiService from "./ai.service";
import userService from "./user.service";

export class VisionService {
	async processVisionUpload(uid: string, documentId: string) {
		try {
			logger.info(`Processing vision file upload: ${documentId}`);

			const docRef = firestore().collection(`users/${uid}/calorie-vision`).doc(documentId);
			const snapshot = await docRef.get();
			const docData = snapshot.data() as CalorieVisionDb;
			if (!snapshot.exists) {
				logger.error(`Document with ID ${documentId} does not exist`);
				return;
			}

			const healthProfile = await userService.getHealthProfile(uid);
			const dataUri = await this.getImageUri(uid, docData.fileName);
			const result = await aiService.analyzeVisionImage(dataUri, healthProfile, docData.imageDescription).catch(async (error) => {
				await this.handleError(error, uid, docRef.id);
			});

			if (!result) {
				logger.error("Failed to get response from OpenAI Vision API");
				return;
			}

			if (!result.isValidFoodImage) {
				logger.warn("Image is not a valid food image, updating status to NotFoodImage");
				await visionService.updateVisionDocument(uid, docRef.id, { status: CalorieVisionStatus.NotFoodImage });
				return;
			}

			logger.info("Vision analysis completed. Updating status...");
			await visionService.updateVisionDocument(uid, docRef.id, { status: CalorieVisionStatus.Complete, result });

			logger.info(`Vision analysis completed and saved to Firestore with ID: ${docRef.id}`);
		} catch (error) {
			await this.handleError(error);
		}
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

	private async getImageUri(uid: string, fileName: string): Promise<string> {
		const bucket = storage().bucket();
		const file = bucket.file(`calorie-vision/${uid}/${fileName}`);

		const [metadata] = await file.getMetadata({});
		const mimeType = metadata.contentType || "image/jpeg";

		const [fileContent] = await file.download();
		const base64Image = fileContent.toString("base64");

		return `data:${mimeType};base64,${base64Image}`;
	}

	private async handleError(error: unknown, userId?: string, documentId?: string) {
		logger.error("Error processing vision upload:", error);

		if (userId && documentId) {
			await this.updateVisionDocument(userId, documentId, { status: CalorieVisionStatus.Error });
		}
	}
}

export default new VisionService();
