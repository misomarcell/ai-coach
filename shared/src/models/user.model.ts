import { FieldValue } from "firebase-admin/firestore";

export enum CommunicationFrequency {
	Weekly = "weekly",
	BiWeekly = "bi-weekly",
	Monthly = "monthly"
}

export type CommunicationChannel = "email" | "telegram" | "none";
export interface CommunicationPreferences {
	communicationFrequency?: CommunicationFrequency;
	communicationChannel?: CommunicationChannel;
}

export interface UserProfile {
	id: string;
	providerId: string;
	created: Date;
	communicationPreferences?: CommunicationPreferences;
	email?: string;
	displayName?: string;
	photoURL?: string;
}

export interface UserProfileDb extends Omit<UserProfile, "created"> {
	created: FieldValue;
}
