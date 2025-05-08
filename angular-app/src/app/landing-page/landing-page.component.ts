import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { VisionDemoComponent } from "./vision-demo/vision-demo.component";

@Component({
	imports: [RouterLink, MatButtonModule, VisionDemoComponent],
	templateUrl: "./landing-page.component.html",
	styleUrl: "./landing-page.component.scss"
})
export class LandingPageComponent {}
