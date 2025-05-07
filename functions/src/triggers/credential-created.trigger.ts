import { CronometerCredentialDb, CronometerCredentialStatus } from "@aicoach/shared";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/firestore";
import cronometerConnector, { ConnectorError } from "../connectors/cronometer-connector";
import { ConnectorErrorType } from "../models/cronometer-connector.model";
import cronometerCredentialService from "../services/credential.service";

export const credentialsCreated = onDocumentCreated(
	{
		document: "users/{userId}/credentials/{credentialId}",
		memory: "1GiB",
		timeoutSeconds: 300,
		region: "europe-west1"
	},
	async (event) => {
		const snapshot = event.data;

		if (!snapshot) {
			logger.error("No document snapshot");

			return;
		}

		const uid = event.params.userId;
		const credential = snapshot.data() as CronometerCredentialDb;

		try {
			await cronometerConnector.init();
			await cronometerConnector.login(credential.credentials.username, credential.credentials.password);
			await cronometerCredentialService.setVerificationStatus(uid, CronometerCredentialStatus.Verified);
		} catch (error) {
			logger.error("Error validating credential", error);

			if (error instanceof ConnectorError) {
				if (error.type === ConnectorErrorType.LoginError) {
					await cronometerCredentialService.setVerificationStatus(uid, CronometerCredentialStatus.Invalid);
				}
			} else {
				await cronometerCredentialService.setVerificationStatus(uid, CronometerCredentialStatus.Error);
				logger.error(`Error validating credential for user ${uid}`, error);
			}
		} finally {
			await cronometerConnector.close();
		}
	}
);
