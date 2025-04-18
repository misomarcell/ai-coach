import { Component, inject, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
	selector: "app-page-title",
	imports: [MatButtonModule, MatIconModule],
	templateUrl: "./page-title.component.html",
	styleUrl: "./page-title.component.scss"
})
export class PageTitleComponent {
	private route = inject(ActivatedRoute);
	private router = inject(Router);

	title = input.required<string>();

	onBackClick() {
		if (this.route.snapshot.parent) {
			this.router.navigate(["../"], { relativeTo: this.route });
		} else {
			this.router.navigate(["/"]);
		}
	}
}
