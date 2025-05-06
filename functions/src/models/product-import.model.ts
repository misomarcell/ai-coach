import { FieldValue, Timestamp } from "firebase-admin/firestore";

export interface ProductImport {
	code: string;
	createdAt: FieldValue | Timestamp;
	lastUpdatedAt: FieldValue | Timestamp;
	status: "pending" | "imported" | "updated" | "failed";
	error?: string;
}
