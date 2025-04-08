import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { CalorieVisionUploadComponent } from "./calorie-vision-upload/calorie-vision-upload.component";
import { CalorieVisionResultsComponent } from "./calorie-vision-results/calorie-vision-results.component";

@Component({
	selector: "app-calorie-vision",
	imports: [CommonModule, MatCardModule, CalorieVisionUploadComponent, CalorieVisionResultsComponent],
	templateUrl: "./calorie-vision.component.html",
	styleUrl: "./calorie-vision.component.scss"
})
export class CalorieVisionComponent {
	currentFileName: string | undefined;

	handleUploadStarted(): void {
		this.currentFileName = undefined;
	}

	handleUploadComplete(data: { fileName: string; imageUrl: string }): void {
		this.currentFileName = data.fileName;
	}
}
