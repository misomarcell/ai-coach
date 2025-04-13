import { Nutrition } from "./food.model";

export interface DailyTargetsResult {
	model: string;
	explanation: string;
	nutritons: Nutrition[];
}
