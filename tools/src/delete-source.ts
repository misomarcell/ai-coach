import { FirestoreConnector } from "./import-tools/import-base";

var prompt = require("prompt-sync")();

async function main() {
	const recordsInput = prompt("Source to delete foods of (usda/ciqual/cofid/...): ");
	if (!recordsInput) {
		console.error("Source is required.");
		return;
	}

	const envInput = prompt("Environment (prod / blank = dev): ") ?? "dev";
	if (envInput && !["prod", "dev"].includes(envInput)) {
		throw new Error("Invalid environment entered. Please enter either 'prod', 'dev' or leave blank for dev.");
	}

	const firestoreConnector = new FirestoreConnector(envInput === "prod");
	await firestoreConnector.deleteFoodsFromSource(recordsInput);

	console.log(`Foods with source "${recordsInput}" deleted successfully.`);
}

(async () => main())();
