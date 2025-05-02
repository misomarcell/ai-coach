import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { AiModel } from "./ai-shared.model";

export interface SettingsProfile {
	receiveNewsAndUpdates?: boolean;
	aiModel?: AiModel;
	lastUpdated?: Date;
}

export interface SettingsProfileDb extends Omit<SettingsProfile, "lastUpdated"> {
	lastUpdated?: FieldValue | Timestamp;
}
