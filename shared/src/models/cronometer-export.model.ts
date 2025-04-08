import { Timestamp } from "firebase-admin/firestore";

export type CronometerExportSource = "cronometer" | "file";
export type CronometerExportRequestStatus = "pending" | "exporting" | "processing" | "error" | "success";
export interface CronometerExportRequest {
	id: string;
	created: Date;
	service: "cronometer";
	source: CronometerExportSource;
	status: CronometerExportRequestStatus;
}

export interface CronometerExportRequestDb extends Omit<CronometerExportRequest, "created"> {
	created: Timestamp;
}
