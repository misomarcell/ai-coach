import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Nutrition } from "./food.model";

export interface DailyTargetsResult {
	model: string;
	explanation: string;
	lastUpdated: Date;
	nutritons: Nutrition[];
}

export interface DailyTargetsResultDb extends Omit<DailyTargetsResult, "lastUpdated"> {
	lastUpdated: FieldValue | Timestamp;
}
