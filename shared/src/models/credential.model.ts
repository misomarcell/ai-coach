import { Timestamp } from "firebase-admin/firestore";

export enum CronometerCredentialStatus {
	Unknown = "unknown",
	Processing = "processing",
	Verified = "verified",
	Invalid = "invalid"
}

export interface CronometerCredential {
	id: string;
	status: CronometerCredentialStatus;
	credentials: {
		username: string;
		password: string;
	};
	created: Date;
	verifiedAt?: Date;
}

export interface CronometerCredentialDb extends Omit<CronometerCredential, "created" | "verifiedAt"> {
	verifiedAt?: Timestamp;
	created: Timestamp;
}
