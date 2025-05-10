import { Component, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { PwaService } from "../services/pwa.service";
import { AnalyticsDemoComponent } from "./analytics-demo/analytics-demo.component";
import { DatabaseDemoComponent } from "./database-demo/database-demo.component";
import { FooterSectionComponent } from "./footer-section/footer-section.component";
import { ImportDemoComponent } from "./import-demo/import-demo.component";
import { ServingsDemoComponent } from "./servings-demo/servings-demo.component";
import { VisionDemoComponent } from "./vision-demo/vision-demo.component";

@Component({
	imports: [
		RouterLink,
		MatButtonModule,
		MatIconModule,
		MatDividerModule,
		VisionDemoComponent,
		ImportDemoComponent,
		ServingsDemoComponent,
		DatabaseDemoComponent,
		AnalyticsDemoComponent,
		FooterSectionComponent,
		ImportDemoComponent
	],
	templateUrl: "./landing-page.component.html",
	styleUrl: "./landing-page.component.scss"
})
export class LandingPageComponent {
	private pwaService = inject(PwaService);

	isReadyToInstall = signal(false);

	constructor() {
		this.isReadyToInstall.set(this.pwaService.isReadyToInstall());
	}

	installApp() {
		if (this.pwaService.isReadyToInstall()) {
			this.pwaService.promptInstallPwa();
		}
	}
}
