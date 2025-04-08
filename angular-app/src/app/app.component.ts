import { Component } from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
import { RouterOutlet } from "@angular/router";

const ICONS = [
	"telegram",
	"cronometer",
	"croissant",
	"capsules-solid",
	"baby-solid",
	"bottle-droplet-solid",
	"bottle-water-solid",
	"bowl-food-solid",
	"candy-cane-solid",
	"carrot-solid",
	"cow-solid",
	"drumstick-bite-solid",
	"fish-solid",
	"lemon-solid",
	"nut",
	"ramen",
	"spagetti",
	"pepper-hot-solid",
	"pizza-slice-solid",
	"utensils-solid",
	"question-solid",
	"wheat-awn-solid"
];

@Component({
	selector: "app-root",
	imports: [RouterOutlet],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss"
})
export class AppComponent {
	constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
		for (const icon of ICONS) {
			iconRegistry.addSvgIcon(icon, sanitizer.bypassSecurityTrustResourceUrl(`assets/icons/${icon}.svg`));
		}
	}
}
