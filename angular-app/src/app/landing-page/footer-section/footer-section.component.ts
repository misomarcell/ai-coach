import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

@Component({
	selector: "app-footer-section",
	imports: [RouterLink, MatIconModule],
	templateUrl: "./footer-section.component.html",
	styleUrl: "./footer-section.component.scss"
})
export class FooterSectionComponent {}
