import { NativeDateAdapter } from "@angular/material/core";

export class CustomDateAdapter extends NativeDateAdapter {
	override format(date: Date, _displayFormat: any): string {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, "0");
		const d = String(date.getDate()).padStart(2, "0");

		return `${y}-${m}-${d}`;
	}
}
