import { firestore } from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { ProductImport } from "../models/product-import.model";

export class ProductImportService {
	async createImportRequest(code: string, lastUpdatedAt: Date): Promise<void> {
		const importRequest: ProductImport = {
			code,
			status: "pending",
			createdAt: FieldValue.serverTimestamp(),
			lastUpdatedAt: Timestamp.fromDate(lastUpdatedAt)
		};

		await firestore().collection("product-imports").add(importRequest);
	}
}

export default new ProductImportService();
