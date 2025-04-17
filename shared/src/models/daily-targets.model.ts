import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Nutrition } from "./food.model";

export type DailyTargetStatus = "ready" | "error" | "in-progress";

export interface DailyTargets {
	explanation: string;
	lastUpdated: Date;
	nutritons: Nutrition[];
	status: DailyTargetStatus;
}

export interface DailyTargetsDb extends Omit<DailyTargets, "lastUpdated"> {
	lastUpdated: FieldValue | Timestamp;
}

export interface DailyTargetsResult {
	model: string;
	nutritons: Nutrition[];
	explanation: string;
}
