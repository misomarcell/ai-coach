import { UserProfileDb } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { auth, logger } from "firebase-functions/v1";

export const userAuthCreated = auth.user().onCreate(async (user) => {
	const existingUserDoc = await firestore().collection("users").doc(user.uid).get();

	if (existingUserDoc.exists) {
		logger.info("User already exists", user.uid);
		return;
	}

	try {
		const newUser: UserProfileDb = {
			id: user.uid,
			displayName: user.displayName,
			providerId: user.providerData[0].providerId,
			email: user.email,
			photoURL: user.photoURL,
			created: FieldValue.serverTimestamp()
		};

		await firestore().collection("users").doc(user.uid).set(newUser);
		logger.info("User created", user.uid);
	} catch (error) {
		logger.error("Error creating user", error);
	}
});
