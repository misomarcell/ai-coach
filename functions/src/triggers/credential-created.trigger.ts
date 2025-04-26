import { CronometerCredentialDb, CronometerCredentialStatus } from "@aicoach/shared";
import { onDocumentCreated } from "firebase-functions/firestore";
import { logger } from "firebase-functions";
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
		logger.info(`Processing cronometer credentials on user ${uid}`);

		try {
			await cronometerConnector.init();
			await cronometerConnector.login(credential.credentials.username, credential.credentials.password);
			await cronometerCredentialService.setVerificationStatus(uid, CronometerCredentialStatus.Verified);

			logger.info("Cronometer credential verified successfully");
		} catch (error) {
			logger.error("Error validating credential", error);

			if (error instanceof ConnectorError) {
				if (error.type === ConnectorErrorType.LoginError) {
					await cronometerCredentialService.setVerificationStatus(uid, CronometerCredentialStatus.Invalid);

					logger.info("Cronometer credential marked as invalid");
				}
			} else {
				await cronometerCredentialService.setVerificationStatus(uid, CronometerCredentialStatus.Error);
				logger.info("Cronometer credential marked as error");
			}
		} finally {
			await cronometerConnector.close();
		}
	}
);
