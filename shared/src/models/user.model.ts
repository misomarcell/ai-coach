import { FieldValue } from "firebase-admin/firestore";
import { AnalysisPreferences } from "./analysis.model";

export interface TelegramConnection {
	connectCode: string;
	username?: string;
	chatId?: number;
}

export interface UserProfileDb {
	id: string;
	created: FieldValue;
	providerId: string;
	email?: string;
	displayName?: string;
	photoURL?: string;
	analysisPreferences?: AnalysisPreferences;
	telegramConnection?: TelegramConnection;
}

export interface UserProfile extends Omit<UserProfileDb, "created"> {
	created: Date;
}
