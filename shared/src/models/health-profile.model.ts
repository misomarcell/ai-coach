import { FieldValue, Timestamp } from "firebase-admin/firestore";

export interface HealthProfile {
	gender: "male" | "female";
	heightCm: number;
	weightKg: number;
	birthDate: Date;
	activityLevel: "sedentary" | "light" | "moderate" | "active" | "very active";
	dietGoals: string[];
	dietaryRestrictions?: string[];
	healthConditions?: string[];
}

export interface HealthProfileDb extends Omit<HealthProfile, "birthDate"> {
	birthDate: Timestamp | FieldValue;
}
