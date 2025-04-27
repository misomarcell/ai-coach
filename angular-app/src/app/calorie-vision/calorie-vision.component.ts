import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
	selector: "app-calorie-vision",
	imports: [RouterOutlet],
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
