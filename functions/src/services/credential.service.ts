import { CronometerCredentialDb, CronometerCredentialStatus } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export class CronometerCredentialService {
	async getCredentials(uid: string, type: string): Promise<CronometerCredentialDb> {
		const credentialDocs = await firestore()
			.collection(`users/${uid}/credentials`)
			.where("type", "==", type)
			.orderBy("verifiedAt", "desc")
			.limit(1)
			.get();

		return credentialDocs.docs[0].data() as CronometerCredentialDb;
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
