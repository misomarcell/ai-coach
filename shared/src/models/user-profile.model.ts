import { FieldValue } from "firebase-admin/firestore";

export interface UserProfile {
	id: string;
	providerId: string;
	created: Date;
	email?: string;
	displayName?: string;
	photoURL?: string;
	telegramConnectCode?: string;
}

export interface UserProfileDb extends Omit<UserProfile, "created"> {
	created: FieldValue;
}
