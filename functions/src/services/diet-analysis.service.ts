import { AnalysisDb, AnalysisRequestDb, AnalysisRequestStatus } from "@aicoach/shared";
import { AiModel } from "@aicoach/shared/models/ai-shared.model";
import { firestore } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { AnalysisResultBase } from "../models/ai-service.model";
import { CommunicationMessageFormat } from "../models/communication.model";
import communicationService from "./communication.service";

export class DietAnalysisService {
	async createAnalysisRequest(uid: string, model: AiModel): Promise<string> {
		const document = firestore().collection(`users/${uid}/analyses`).doc();
		const analysisId = document.id;

		await document.set({
			id: analysisId,
			request: {
				model,
				created: FieldValue.serverTimestamp(),
				status: AnalysisRequestStatus.Created
			}
		});

		logger.info("Analysis request created", {
			uid,
			analysisId
		});

		return analysisId;
	}

	async getAnalysis(uid: string, analysisId: string): Promise<AnalysisDb | null> {
		const doc = await firestore().doc(`users/${uid}/analyses/${analysisId}`).get();

		if (!doc.exists) {
			return null;
		}

		return {
			id: doc.id,
			...doc.data()
		} as AnalysisDb;
	}

	async getAnalysesByStatus(uid: string, statuses: AnalysisRequestStatus[]): Promise<AnalysisDb[]> {
		const collection = await firestore().collection(`users/${uid}/analyses`).where("request.status", "in", statuses).get();

		return collection.empty
			? []
			: collection.docs.map(
					(doc) =>
						({
							id: doc.id,
							...doc.data()
						} as AnalysisDb)
			  );
	}

	async updateAnalysisStatus(uid: string, analysisId: string, status: AnalysisRequestStatus, failureReason?: string): Promise<void> {
		const updateData: { request: Partial<AnalysisRequestDb> } = {
			request: {
				status
			}
		};

		if (status === AnalysisRequestStatus.Completed) {
			updateData.request.completedAt = FieldValue.serverTimestamp();
		} else if (status === AnalysisRequestStatus.Failed && failureReason) {
			updateData.request.failureReason = failureReason;
		}

		await firestore().doc(`users/${uid}/analyses/${analysisId}`).set(updateData, { merge: true });

		logger.info(`Analysis ${analysisId} status updated to ${status}`, {
			uid
		});
	}

	async setAnalysisResult(uid: string, analysisId: string, result: AnalysisResultBase): Promise<string> {
		const document = firestore().doc(`users/${uid}/analyses/${analysisId}`);

		return document
			.set(
				{
					result: {
						...result,
						created: FieldValue.serverTimestamp()
					}
				},
				{ merge: true }
			)
			.then(() => document.id);
	}

	async sendAnalysisResult(uid: string, analysisId: string): Promise<void> {
		const analysis = await this.getAnalysis(uid, analysisId);
		if (!analysis) {
			logger.error("Analysis not found", { uid, analysisId });
			return;
		}

		const channels = await communicationService.getCommunicationChannels(uid);
		for (const channel of channels) {
			await communicationService.createCommunication(uid, channel.type, {
				analysisResult: analysis.result,
				format: CommunicationMessageFormat.HTML
			});
		}
	}
}

export default new DietAnalysisService();
