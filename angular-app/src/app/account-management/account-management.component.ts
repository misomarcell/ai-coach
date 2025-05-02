import { Component, inject } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
	imports: [MatProgressSpinnerModule],
	templateUrl: "./account-management.component.html",
	styleUrl: "./account-management.component.scss"
})
export class AccountManagementComponent {
	private router = inject(Router);
	private activatedRoute = inject(ActivatedRoute);
	private mode: "resetPassword" | "verifyEmail" | "verifyAndChangeEmail" | undefined = undefined;

	constructor() {
		this.mode = this.activatedRoute.snapshot.queryParams["mode"] || "unknown";

		switch (this.mode) {
			case "resetPassword":
				this.router.navigate(["/forgot-password"], { queryParams: { step: "new-password" }, queryParamsHandling: "merge" });
				break;
			case "verifyEmail":
			case "verifyAndChangeEmail":
				this.router.navigate(["/verify-email"], { queryParamsHandling: "merge" });
				break;
			default:
				this.router.navigate(["/not-found"]);
				break;
		}
	}
}
