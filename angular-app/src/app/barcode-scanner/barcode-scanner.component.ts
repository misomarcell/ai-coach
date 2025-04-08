import { isPlatformServer } from "@angular/common";
import { AfterViewInit, Component, inject, output, PLATFORM_ID, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BarcodeFormat, Result } from "@zxing/library";
import { ZXingScannerComponent, ZXingScannerModule } from "@zxing/ngx-scanner";

export interface ScannerModalData {
	emitFirstResult: boolean;
}

@Component({
	imports: [
		ZXingScannerModule,
		MatInputModule,
		MatSelectModule,
		FormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatIconModule,
		MatTooltipModule,
		MatProgressSpinnerModule
	],
	selector: "app-barcode-scanner",
	templateUrl: "./barcode-scanner.component.html",
	styleUrl: "./barcode-scanner.component.scss"
})
export class BarcodeScannerComponent implements AfterViewInit {
	result: Result | undefined;
	resultText = "";
	availableDevices: MediaDeviceInfo[] = [];
	selectedDevice: MediaDeviceInfo | undefined;
	allowedFormats: BarcodeFormat[] = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8];
	isLoadingCamera = true;
	enableScanner = true;
	torchCompatible = false;
	torchEnabled = false;
	hasTorch = false;

	dialogRef = inject(MatDialogRef<BarcodeScannerComponent>, { optional: true });
	private paltformId = inject(PLATFORM_ID);
	private data = inject<ScannerModalData>(MAT_DIALOG_DATA, { optional: true });

	scanComplete = output<Result>();

	@ViewChild("scanner", { static: false }) scanner: ZXingScannerComponent | undefined;
	constructor() {
		if (isPlatformServer(this.paltformId)) {
			this.enableScanner = false;
			return;
		}
	}

	ngAfterViewInit(): void {
		if (isPlatformServer(this.paltformId)) {
			return;
		}

		const selectedDeviceId = localStorage.getItem("selectedDevice");
		if (selectedDeviceId) {
			this.selectedDevice = this.availableDevices.find((device) => device.deviceId === selectedDeviceId);
		}
	}

	onDeviceChanges(device: MediaDeviceInfo) {
		if (isPlatformServer(this.paltformId)) {
			return;
		}

		if (device.deviceId) {
			localStorage.setItem("selectedDevice", device.deviceId);
		} else {
			localStorage.removeItem("selectedDevice");
		}
	}

	onAutostarted() {
		const selectedDeviceId = localStorage.getItem("selectedDevice");
		if (selectedDeviceId) {
			this.selectedDevice = this.availableDevices.find((device) => device.deviceId === selectedDeviceId) ?? this.availableDevices[0];
		}

		this.isLoadingCamera = false;
	}

	onCamerasFound(devices: MediaDeviceInfo[]) {
		this.availableDevices = devices;
		this.enableScanner = true;
	}

	onScanComplete(result: Result) {
		if (!result) {
			return;
		}

		this.result = result;
		this.resultText = result.getText();
		if (this.dialogRef && this.data?.emitFirstResult) {
			this.dialogRef.close(this.result);
		} else {
			this.scanComplete.emit(result);
		}
	}

	toggleTorch(): void {
		this.torchEnabled = !this.torchEnabled;
		if (this.scanner) {
			this.scanner.torch = this.torchEnabled;
		}
	}

	onSubmitClick() {
		if (this.dialogRef && this.result) {
			this.dialogRef.close(this.result);
		}
	}

	onCloseClick() {
		this.dialogRef?.close();
	}
}
