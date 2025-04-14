import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Nutrition } from "./food.model";

export interface DailyTargets {
	explanation: string;
	lastUpdated: Date;
	nutritons: Nutrition[];
}

export interface DailyTargetsDb extends Omit<DailyTargets, "lastUpdated"> {
	lastUpdated: FieldValue | Timestamp;
}

export interface DailyTargetsResult {
	model: string;
	nutritons: Nutrition[];
	explanation: string;
}
