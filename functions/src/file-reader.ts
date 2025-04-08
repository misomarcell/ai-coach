import path from "path";
import fs from "fs";
import { logger } from "firebase-functions";

export class FileReader {
	readFileContent(filePath: string): string | undefined {
		if (!filePath || !fs.existsSync(filePath)) {
			logger.error("File not found", filePath ?? "No fileName provided");
			return;
		}

		return fs.readFileSync(filePath, "utf-8");
	}

	readDownloadedFileContent(fileName: string): string | undefined {
		const filePath = path.join(this.getDownloadFolder(), fileName);

		return this.readFileContent(filePath);
	}

	getDownloadFolder(): string {
		const folder = path.join(__dirname, "downloads");
		if (!fs.existsSync(folder)) {
			fs.mkdirSync(folder);
		}

		return folder;
	}
}

export default new FileReader();
