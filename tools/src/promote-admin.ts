import { config } from "dotenv";
import { auth } from "firebase-admin";
import { cert, initializeApp } from "firebase-admin/app";
import path from "path";

var prompt = require("prompt-sync")();

async function main() {
	config({ path: path.resolve(__dirname, "../.env.local") });

	const uid = prompt("User ID for Promotion: ");
	if (!uid) {
		console.error("User ID is required.");
		return;
	}

	const serviceAccountPath = process.env["SERVICE_ACCOUNT_PATH"] ?? "";
	const FIREBASE_APP = initializeApp({
		projectId: "kombuch-ai",
		credential: cert(serviceAccountPath)
	});

	console.log("Firebase app initialized", { app: FIREBASE_APP.options.projectId });

	await auth()
		.setCustomUserClaims(uid, { admin: true })
		.then(() => console.log("✅ User promoted successfully."))
		.catch((error) => console.error("❌ Error promoting user:", error));
}

(async () => main())();
