import { Report } from "@aicoach/shared";
import { Component, inject, signal } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, EMPTY, finalize, take, tap } from "rxjs";
import { PageTitleComponent } from "../page-title/page-title.component";
import { ReportService } from "../services/report.service";

@Component({
	imports: [
		PageTitleComponent,
		FormsModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatProgressSpinnerModule
	],
	templateUrl: "./report-page.component.html",
	styleUrl: "./report-page.component.scss"
})
export class ReportPageComponent {
	private activatedRoute = inject(ActivatedRoute);
	private router = inject(Router);
	private reportService = inject(ReportService);
	private snackBar = inject(MatSnackBar);

	isLoading = signal(false);

	formGroup = new FormGroup({
		title: new FormControl("", [Validators.required, Validators.minLength(5), Validators.maxLength(100)]),
		description: new FormControl("", [Validators.required, Validators.minLength(10), Validators.maxLength(500)])
	});

	constructor() {
		const title = this.activatedRoute.snapshot.queryParamMap.get("title");
		this.formGroup.get("title")?.setValue(title);
	}

	onSubmit() {
		const foodId = this.activatedRoute.snapshot.queryParamMap.get("foodId");
		const barcode = this.activatedRoute.snapshot.queryParamMap.get("barcode");

		if (this.formGroup.invalid) {
			this.snackBar.open("Please fill in all fields", "OK", { panelClass: "snackbar-error" });
			return;
		}

		if (!foodId && !barcode) {
			this.snackBar.open("Report cannot be created", "OK", { panelClass: "snackbar-error" });
			return;
		}

		this.isLoading.set(true);

		const report: Omit<Report, "id" | "createdAt" | "createdBy"> = {
			title: this.formGroup.get("title")!.value || "",
			description: this.formGroup.get("description")!.value || "",
			foodId: foodId || undefined,
			barcode: barcode || undefined
		};

		this.reportService
			.createReport(report)
			.pipe(
				take(1),
				tap(() => {
					this.snackBar.open("Report created successfully", "OK", { panelClass: "snackbar-success" });
					this.formGroup.reset();

					const raw = this.activatedRoute.snapshot.queryParamMap.get("returnUrl");
					const returnUrl = raw ? decodeURIComponent(raw) : "/";
					this.router.navigateByUrl(returnUrl);
				}),
				catchError((error) => {
					this.snackBar.open("Error creating report", "OK", { panelClass: "snackbar-error" });
					console.error("Error creating report", error);
					return EMPTY;
				}),
				finalize(() => this.isLoading.set(false))
			)
			.subscribe();
	}
}
