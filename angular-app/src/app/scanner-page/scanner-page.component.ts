import { Component, inject, signal } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Router } from "@angular/router";
import { Result } from "@zxing/library";
import { BarcodeScannerComponent } from "../barcode-scanner/barcode-scanner.component";
import { PageTitleComponent } from "../page-title/page-title.component";

@Component({
	imports: [PageTitleComponent, BarcodeScannerComponent, MatProgressSpinnerModule],
	templateUrl: "./scanner-page.component.html",
	styleUrl: "./scanner-page.component.scss"
})
export class ScannerPageComponent {
	isLoading = signal(false);

	private router = inject(Router);

	onScanComplete(result: Result) {
		this.isLoading.set(true);

		const barcode = result.getText();

		this.router.navigate(["/scan", barcode], { queryParamsHandling: "preserve" });
	}
}
