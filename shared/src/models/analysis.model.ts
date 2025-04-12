import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { AiModel } from "./ai-shared.model";

export interface FoodSuggestion {
	foodName: string;
	comment: string;
}

export enum AnalysisRequestStatus {
	Created = "created",
	Processing = "processing",
	Completed = "completed",
	Failed = "failed"
}

export interface Analysis {
	id: string;
	request: AnalysisRequest;
	result?: AnalysisResult;
}

export interface AnalysisDb extends Omit<Analysis, "request" | "result"> {
	request: AnalysisRequestDb;
	result?: AnalysisResultDb;
}

export interface AnalysisRequestDb {
	created: FieldValue | Timestamp;
	model: AiModel;
	status: AnalysisRequestStatus;
	completedAt?: FieldValue | Timestamp;
	failureReason?: string;
}

export interface AnalysisRequest extends Omit<AnalysisRequestDb, "created" | "completedAt"> {
	created: Date;
	completedAt?: Date;
}

export interface AnalysisResultDb {
	summary: string;
	suggestions: string[];
	positives: FoodSuggestion[];
	negatives: FoodSuggestion[];
	score: number;
	model: string;
	created: FieldValue | Timestamp;
}

export interface AnalysisResult extends Omit<AnalysisResultDb, "created"> {
	created: Date;
}
