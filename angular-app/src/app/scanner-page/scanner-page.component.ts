import { Component, inject, signal } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Router } from "@angular/router";
import { Result } from "@zxing/library";
import { from, switchMap, tap } from "rxjs";
import { BarcodeScannerComponent } from "../barcode-scanner/barcode-scanner.component";
import { PageTitleComponent } from "../page-title/page-title.component";
import { FoodService } from "../services/food.service";

@Component({
	imports: [PageTitleComponent, BarcodeScannerComponent, MatProgressSpinnerModule],
	templateUrl: "./scanner-page.component.html",
	styleUrl: "./scanner-page.component.scss"
})
export class ScannerPageComponent {
	isLoading = signal(false);

	private router = inject(Router);
	private foodService = inject(FoodService);

	onScanComplete(result: Result) {
		this.isLoading.set(true);
		this.foodService
			.getFoodByBarcode(result.getText())
			.pipe(
				tap(() => this.isLoading.set(false)),
				switchMap((food) =>
					from(
						food
							? this.router.navigate(["/food-list"], { queryParams: { barcode: result.getText() } })
							: this.router.navigate(["/foods"], { queryParams: { barcode: result.getText() } })
					)
				)
			)
			.subscribe();
	}
}
