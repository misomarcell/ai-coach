import { aiModels, SettingsProfileDb, UserProfileDb } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { UserRecord } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { auth, logger } from "firebase-functions/v1";

export const userAuthCreated = auth.user().onCreate(async (user) => {
	try {
		await createUserProfile(user);
		await createUserSettings(user);
		logger.info("User documents created successfully!", { uid: user.uid });
	} catch (error) {
		logger.error("Error creating user", error);
	}

	async function createUserProfile(user: UserRecord): Promise<void> {
		const newUser: UserProfileDb = {
			id: user.uid,
			providerId: user.providerData[0].providerId,
			email: user.email,
			photoURL: user.photoURL,
			created: FieldValue.serverTimestamp()
		};

		if (user.displayName) {
			newUser.displayName = user.displayName;
		}

		await firestore().collection("users").doc(user.uid).set(newUser, { merge: true });
		logger.info("User profile created", { uid: user.uid });
	}

	async function createUserSettings(user: UserRecord): Promise<void> {
		const userSettings: SettingsProfileDb = {
			aiModel: aiModels[0],
			receiveNewsAndUpdates: true,
			lastUpdated: FieldValue.serverTimestamp()
		};

		await firestore().doc(`users/${user.uid}/profiles/settings-profile`).set(userSettings, { merge: true });
		logger.info("User settings created", { uid: user.uid });
	}
});
