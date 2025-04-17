import { DatePipe } from "@angular/common";
import { Component, effect, output, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
	selector: "app-date-selector",
	imports: [DatePipe, MatIconModule, MatButtonModule],
	templateUrl: "./date-selector.component.html",
	styleUrl: "./date-selector.component.scss"
})
export class DateSelectorComponent {
	selectedDate = signal<Date>(new Date());
	dateChanged = output<Date>();

	constructor() {
		effect(() => {
			const date = this.selectedDate();
			if (date) {
				this.dateChanged.emit(date);
			}
		});
	}

	previousDay(): void {
		const currentDate = this.selectedDate();
		const previousDate = new Date(currentDate);
		previousDate.setDate(previousDate.getDate() - 1);
		this.selectedDate.set(previousDate);
	}

	nextDay(): void {
		const currentDate = this.selectedDate();
		const nextDate = new Date(currentDate);
		nextDate.setDate(nextDate.getDate() + 1);
		this.selectedDate.set(nextDate);
	}

	today(): void {
		this.selectedDate.set(new Date());
	}
}
