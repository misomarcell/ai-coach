import { FieldValue, Timestamp } from "firebase-admin/firestore";

export interface AccountDeletion {
	id: string;
	uid: string;
	requestedAt: Date;
	status: "pending" | "completed" | "failed";
	error?: string;
}

export interface AccountDeletionDb extends Omit<AccountDeletion, "requestedAt"> {
	requestedAt: FieldValue | Timestamp;
}
