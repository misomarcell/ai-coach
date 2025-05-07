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

	main = input<boolean>(false);
	title = input.required<string>();

	onBackClick() {
		const backUrl = window.history.state?.backUrl;

		if (backUrl) {
			this.router.navigateByUrl(backUrl);
		} else if (window.history.length > 1) {
			window.history.back();
		} else if (this.route.snapshot.parent) {
			this.router.navigate(["../"], { relativeTo: this.route });
		} else {
			this.router.navigate(["/dashboard"]);
		}
	}
}
