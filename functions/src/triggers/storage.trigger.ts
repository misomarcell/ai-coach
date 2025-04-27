import { storage } from "firebase-admin";
import { logger } from "firebase-functions";
import { onObjectFinalized, StorageObjectData } from "firebase-functions/storage";
import labelAnalyzerService from "../services/label-analyzer.service";

export const storageTrigger = onObjectFinalized(
	{
		bucket: "kombuch-ai.firebasestorage.app",
		secrets: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
		region: "us-east1",
		timeoutSeconds: 300,
		memory: "1GiB"
	},
	async (object) => {
		const filePath = object.data.name;
		if (filePath.startsWith("product-images/")) {
			await handleProductImageUpload(object.data);
			return;
		}
	}
);

async function handleProductImageUpload(data: StorageObjectData) {
	try {
		const filePath = data.name;

		const pathInfo = extractPathInfo(filePath);
		if (!pathInfo) {
			logger.error(`Invalid file path structure: ${filePath}`);
			return;
		}

		const { uid, foodId, fileName } = pathInfo;
		const currentFileType = fileName.includes("label") ? "label" : "package";
		const otherFileType = currentFileType === "label" ? "package" : "label";

		const otherFilePath = await findOtherFile(data.bucket, uid, foodId, otherFileType);
		if (!otherFilePath) {
			logger.log(`Waiting for ${otherFileType} file to be uploaded for food ${foodId}`);
			return;
		}

		const labelPath = currentFileType === "label" ? filePath : otherFilePath;
		const packagePath = currentFileType === "package" ? filePath : otherFilePath;

		await labelAnalyzerService.analyzeLabel({ bucket: data.bucket, labelPath, packagePath });
	} catch (error) {
		logger.error("Error processing product images:", error);
	}
}

function extractPathInfo(filePath: string) {
	const pathParts = filePath.split("/");
	if (pathParts.length < 4) {
		return null;
	}

	return {
		uid: pathParts[1],
		foodId: pathParts[2],
		fileName: pathParts[3]
	};
}

async function findOtherFile(bucketName: string, uid: string, foodId: string, fileType: string) {
	const bucket = storage().bucket(bucketName);
	const prefix = `product-images/${uid}/${foodId}/`;

	try {
		const [files] = await bucket.getFiles({ prefix });
		const matchingFile = files.find((file) => {
			const name = file.name.split("/").pop() || "";
			return name.includes(fileType);
		});

		return matchingFile ? matchingFile.name : null;
	} catch (error) {
		logger.error(`Error finding ${fileType} file:`, error);
		return null;
	}
}
