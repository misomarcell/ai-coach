import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Result } from "@zxing/library";
import { Observable } from "rxjs";
import { BarcodeScannerComponent, ScannerModalData } from "../barcode-scanner/barcode-scanner.component";

@Injectable({
	providedIn: "root"
})
export class BarcodeScannerService {
	readonly dialog = inject(MatDialog);

	scanBarcode(emitFirstResult = false): Observable<Result | undefined> {
		const dialogRef = this.dialog.open<BarcodeScannerComponent, ScannerModalData, Result>(BarcodeScannerComponent, {
			data: { emitFirstResult },
			width: "90vw",
			maxHeight: "80vh",
			panelClass: "scanner-modal"
		});

		return dialogRef.afterClosed();
	}
}
