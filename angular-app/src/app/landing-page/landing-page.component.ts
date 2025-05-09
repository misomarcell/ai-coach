import { Component, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { VisionDemoComponent } from "./vision-demo/vision-demo.component";
import { ServingsDemoComponent } from "./servings-demo/servings-demo.component";
import { AnalyticsDemoComponent } from "./analytics-demo/analytics-demo.component";
import { FooterSectionComponent } from "./footer-section/footer-section.component";
import { PwaService } from "../services/pwa.service";

@Component({
	imports: [
		RouterLink,
		MatButtonModule,
		MatIconModule,
		VisionDemoComponent,
		ServingsDemoComponent,
		AnalyticsDemoComponent,
		FooterSectionComponent
	],
	templateUrl: "./landing-page.component.html",
	styleUrl: "./landing-page.component.scss"
})
export class LandingPageComponent {
	private pwaService = inject(PwaService);

	isReadyToInstall = signal(this.pwaService.isReadyToInstall());

	installApp() {
		if (this.pwaService.isReadyToInstall()) {
			this.pwaService.promptInstallPwa();
		}
	}
}
