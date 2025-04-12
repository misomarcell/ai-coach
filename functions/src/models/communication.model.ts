import { AnalysisResultDb, CommunicationChannel } from "@aicoach/shared";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const enum CommunicationMessageFormat {
	MarkDownV2 = "MarkDownV2",
	HTML = "HTML"
}

export interface CommunicationMessage {
	text?: string;
	format?: CommunicationMessageFormat;
	analysisResult?: AnalysisResultDb;
}

export interface Communication {
	id: string;
	uid: string;
	channel: CommunicationChannel;
	message: CommunicationMessage;
	created: FieldValue | Timestamp;
}
