import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type CommunicationChannelType = "telegram" | "email";
export interface CommunicationChannel {
	id: string;
	type: CommunicationChannelType;
	name: string;
	address: string;
	created: Date;
	lastUpdated: Date;
}
export interface CommunicationChannelDb extends Omit<CommunicationChannel, "created" | "lastUpdated"> {
	created: FieldValue | Timestamp;
	lastUpdated: FieldValue | Timestamp;
}
