import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { CronometerExportRequestDb, CronometerExportSource, Serving, ServingDb } from "@aicoach/shared";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/firestore";
import { firestore, storage } from "firebase-admin";
import { Timestamp, WriteBatch } from "firebase-admin/firestore";
import cronometerConnector from "../connectors/cronometer-connector";
import credentialService from "../services/credential.service";
import fileReader from "../file-reader";
import cronometerService from "../services/cronometer.service";

export const exportRequestCreated = onDocumentCreated(
	{
		document: "users/{userId}/export-requests/{exportRequestId}",
		memory: "1GiB",
		timeoutSeconds: 300,
		region: "europe-west1"
	},
	async (event) => {
		const snapshot = event.data;
		const userId = event.params.userId;
		const exportRequestId = event.params.exportRequestId;

		if (!snapshot) {
			logger.error("Export request data not found");
			return;
		}

		const exportSource = snapshot?.data()?.source as CronometerExportSource;
		if (!exportSource) {
			logger.error("Export source is not provided.");
			return;
		}

		await snapshot.ref.set({ status: "processing" } as CronometerExportRequestDb, { merge: true });
		logger.info(`Processing export request ${exportRequestId} for user ${userId} with source ${exportSource}`);

		try {
			let servingsContent: string | undefined;

			if (exportSource === "cronometer") {
				const credential = await credentialService.getCredentials(userId, "cronometer");
				await snapshot.ref.set({ status: "exporting" } as CronometerExportRequestDb, { merge: true });

				await cronometerConnector.init();
				await cronometerConnector.login(credential.credentials.username, credential.credentials.password);
				await cronometerConnector.exportData();
				await cronometerConnector.close();

				servingsContent = fileReader.readDownloadedFileContent("servings.csv");
			} else if (exportSource === "file") {
				const bucket = storage().bucket();
				const filePath = `cronometer-exports/${userId}/servings.csv`;
				const tempFilePath = path.join(os.tmpdir(), "servings.csv");

				logger.info(`Downloading file from ${filePath}`);
				await bucket.file(filePath).download({ destination: tempFilePath });

				servingsContent = fs.readFileSync(tempFilePath, "utf-8");
				fs.unlinkSync(tempFilePath);
			}

			if (!servingsContent) {
				throw new Error("Failed to read servings content");
			}

			await snapshot.ref.set({ status: "processing" } as CronometerExportRequestDb, { merge: true });
			logger.info("Servings content read successfully. Converting to database format...");

			const convertedServings = await cronometerService.convertExportToServings(servingsContent);
			if (!convertedServings || convertedServings.length === 0) {
				throw new Error("Failed to convert servings content");
			}
			logger.info(`Servings content converted successfully (${convertedServings.length} items). Adding to database...`);

			await addServingsToFirestore(convertedServings, userId);
			logger.info("Servings added to database successfully.");

			await snapshot.ref.set({ status: "success" } as CronometerExportRequestDb, { merge: true });
			logger.info("Export request completed successfully", { exportRequestId, userId });
		} catch (error) {
			logger.error("Error processing export request", error);
			await snapshot.ref.set({ status: "error" } as CronometerExportRequestDb, { merge: true });
		}
	}
);

function addServingsToFirestore(servings: Serving[], uid: string): Promise<void> {
	const collectionRef = firestore().collection(`users/${uid}/servings`);
	const batchSize = 500;
	const batches: WriteBatch[] = [];

	for (let i = 0; i < servings.length; i += batchSize) {
		const batch = firestore().batch();
		const chunk = servings.slice(i, i + batchSize);

		chunk.forEach((serving) => {
			const docRef = collectionRef.doc();
			const servingData = {
				...serving,
				id: docRef.id,
				created: Timestamp.fromDate(serving.created)
			} as ServingDb;

			batch.set(docRef, servingData);
		});

		batches.push(batch);
	}

	logger.info(`Adding ${servings.length} servings to Firestore in ${batches.length} batches...`);

	return Promise.all(batches.map((batch) => batch.commit()))
		.catch((error) => {
			logger.error("Error adding servings batch to Firestore", error);
		})
		.then(() => undefined);
}
