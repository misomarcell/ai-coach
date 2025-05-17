import { FieldValue, Timestamp } from "firebase-admin/firestore";

export interface Report {
	id: string;
	createdBy: string;
	createdAt: Date;
	title: string;
	description: string;
	foodId?: string;
	barcode?: string;
}

export interface ReportDb extends Omit<Report, "createdAt"> {
	createdAt: FieldValue | Timestamp;
}
