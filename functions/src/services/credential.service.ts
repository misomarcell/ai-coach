import { CronometerCredentialDb, CronometerCredentialStatus } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export class CronometerCredentialService {
	async getCredentials(uid: string, type: string): Promise<CronometerCredentialDb> {
		const docRef = await firestore().doc(`users/${uid}/credentials/${type}`).get();

		if (!docRef.exists) {
			throw new Error("Credentials not found");
		}

		return docRef.data() as CronometerCredentialDb;
	}

	async setVerificationStatus(uid: string, status: CronometerCredentialStatus): Promise<void> {
		await firestore()
			.doc(`users/${uid}/credentials/cronometer`)
			.set(
				{
					status,
					verifiedAt: status === CronometerCredentialStatus.Verified ? FieldValue.serverTimestamp() : undefined
				} as CronometerCredentialDb,
				{ merge: true }
			);
	}
}

export default new CronometerCredentialService();
