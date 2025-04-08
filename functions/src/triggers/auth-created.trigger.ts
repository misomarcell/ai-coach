import { auth } from "firebase-functions/v1";
import { firestore } from "firebase-admin";
import { UserProfileDb } from "@aicoach/shared";
import { FieldValue } from "firebase-admin/firestore";
import { Logger } from "../logger";

export const userAuthCreated = auth.user().onCreate(async (user) => {
	const logger = new Logger("AuthTrigger: userAuthCreated");
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
