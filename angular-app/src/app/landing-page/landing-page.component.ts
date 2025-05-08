import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { VisionDemoComponent } from "./vision-demo/vision-demo.component";
import { ServingsDemoComponent } from "./servings-demo/servings-demo.component";
import { AnalyticsDemoComponent } from "./analytics-demo/analytics-demo.component";
import { FooterSectionComponent } from "./footer-section/footer-section.component";

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
export class LandingPageComponent {}
