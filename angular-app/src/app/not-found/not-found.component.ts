import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";

@Component({
	imports: [MatButtonModule],
	templateUrl: "./not-found.component.html",
	styleUrl: "./not-found.component.scss"
})
export class NotFoundComponent {
	onGoBackClick() {
		if (history.length > 1) {
			history.back();
		} else {
			window.location.href = "/home";
		}
	}
}
