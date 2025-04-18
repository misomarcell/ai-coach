import { CronometerCredentialStatus, CronometerExportRequestStatus, CronometerExportSource } from "@aicoach/shared";
import { NgFor } from "@angular/common";
import { Component, DestroyRef, ElementRef, inject, OnInit, signal, ViewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ref, Storage, uploadBytesResumable } from "@angular/fire/storage";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { filter, finalize, map, switchMap, take, takeWhile, tap } from "rxjs";
import { PromptDialogComponent, PromptDialogData, PromptDialogResult } from "../../prompt-dialog/prompt-dialog.component";
import { AuthService } from "../../services/auth.service";
import { Credentials, CronometerCredentialsService } from "../../services/cronometer-credentials.service";
import { CronometerService } from "../../services/cronometer.service";

@Component({
	selector: "app-cronometer-integration",
	imports: [
		NgFor,
		FormsModule,
		ReactiveFormsModule,
		MatProgressSpinnerModule,
		MatProgressBarModule,
		MatExpansionModule,
		MatFormFieldModule,
		MatCheckboxModule,
		MatDividerModule,
		MatButtonModule,
		MatInputModule,
		MatIconModule
	],
	templateUrl: "./cronometer-integration.component.html",
	styleUrl: "./cronometer-integration.component.scss"
})
export class CronometerIntegrationComponent implements OnInit {
	@ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

	isPasswordVisible = false;
	exportStatus = signal<CronometerExportRequestStatus | null>(null);
	credentials = signal<{ username: string; status: CronometerCredentialStatus } | null>(null);
	uploadProgress = signal<number | null>(null);
	selectedFile = signal<File | null>(null);

	formGroup = new FormGroup({
		email: new FormControl<string>("", [Validators.required, Validators.email]),
		password: new FormControl<string>("", [Validators.required, Validators.minLength(8)]),
		consent: new FormControl<boolean>(false, [Validators.requiredTrue])
	});

	private dialogService = inject(MatDialog);
	private cronometerService = inject(CronometerService);
	private cronoCredentialsService = inject(CronometerCredentialsService);
	private authService = inject(AuthService);
	private router = inject(Router);
	private storage = inject(Storage);
	private snackBar = inject(MatSnackBar);
	private destroyRef = inject(DestroyRef);

	ngOnInit(): void {
		this.cronoCredentialsService
			.getCredentials$()
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				filter((credentials) => !!credentials),
				map((credentials) => ({
					username: credentials.credentials.username,
					status: credentials.status
				}))
			)
			.subscribe((credentials) => this.credentials.set(credentials));
	}

	onConnectClick(): void {
		this.formGroup.markAllAsTouched();
		if (this.formGroup.invalid) {
			return;
		}

		const credentials: Credentials = {
			username: this.formGroup.get("email")?.value || "",
			password: this.formGroup.get("password")?.value || ""
		};

		this.credentials.set({ username: credentials.username, status: CronometerCredentialStatus.Processing });
		this.cronoCredentialsService
			.createCredentials$(credentials)
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				tap(() => this.formGroup.reset())
			)
			.subscribe();
	}

	onDisconnectClick() {
		const dialogRef = this.dialogService.open<PromptDialogComponent, PromptDialogData, PromptDialogResult>(PromptDialogComponent, {
			data: {
				title: "Disconnect Cronometer",
				message: "Are you sure you want to disconnect from Cronometer?",
				buttonLayout: "yes-no"
			}
		});

		dialogRef
			.afterClosed()
			.pipe(
				filter((result) => result === "yes"),
				tap(() => this.credentials.set(null)),
				switchMap(() => this.cronoCredentialsService.deleteCredentials$()),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe();
	}

	onTryAgainClick() {
		this.credentials.set(null);
		this.cronoCredentialsService.deleteCredentials$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
	}

	requestServingsExport(source: CronometerExportSource) {
		const dialogRef = this.dialogService.open<PromptDialogComponent, PromptDialogData, PromptDialogResult>(PromptDialogComponent, {
			data: {
				title: "Export Cronometer Data",
				message: "This will delete any previous exported data from cronometer. Do you want to continue?",
				buttonLayout: "yes-no"
			}
		});

		dialogRef
			.afterClosed()
			.pipe(
				filter((result) => result === "yes"),
				tap(() => this.exportStatus.set("pending")),
				switchMap(() => this.cronometerService.requestServingsExport(source)),
				takeUntilDestroyed(this.destroyRef),
				switchMap((requestId) => this.cronometerService.getExportRequest(requestId)),
				filter((request) => !!request),
				tap((request) => this.exportStatus.set(request.status)),
				tap((request) => {
					if (request.status === "error") {
						this.snackBar.open("Error requesting export", "Close", { duration: 5000 });
					} else if (request.status === "success") {
						this.snackBar.open("Export request completed successfully", "Close", { duration: 5000 });
						this.router.navigate(["/home"]);
					}
				}),
				takeWhile((request) => ["pending", "exporting", "processing"].includes(request.status)),
				finalize(() => this.exportStatus.set(null))
			)
			.subscribe();
	}

	onFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];

			if (!file.name.toLowerCase().endsWith(".csv")) {
				this.snackBar.open("Please select a CSV file", "Close", { duration: 5000 });
				this.resetFileInput();
				return;
			}

			if (file.size > 1024 * 1024) {
				// 1MB max
				this.snackBar.open("File is too large. Maximum size is 1MB", "Close", { duration: 5000 });
				this.resetFileInput();
				return;
			}

			this.selectedFile.set(file);
			this.uploadCsvFile();
		}
	}

	private uploadCsvFile(): void {
		if (!this.selectedFile()) {
			return;
		}

		this.uploadProgress.set(0);

		this.authService.uid
			.pipe(
				take(1),
				filter((uid) => !!uid),
				tap((uid) => {
					if (!uid || !this.selectedFile()) return;

					const filePath = `cronometer-exports/${uid}/servings.csv`;
					const fileRef = ref(this.storage, filePath);
					const task = uploadBytesResumable(fileRef, this.selectedFile()!);

					task.on(
						"state_changed",
						(snapshot) => {
							const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
							this.uploadProgress.set(progress);
						},
						(error) => {
							this.snackBar.open("Upload failed: " + error.message, "Close", { duration: 5000 });
							this.uploadProgress.set(null);
						},
						() => {
							this.uploadProgress.set(null);
							this.snackBar.open("CSV uploaded successfully", "Close");
							this.resetFileInput();

							this.requestServingsExport("file");
						}
					);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe();
	}

	private resetFileInput(): void {
		this.selectedFile.set(null);
		if (this.fileInput?.nativeElement) {
			this.fileInput.nativeElement.value = "";
		}
	}

	getFormErrors(): { controlName: string; message: string }[] {
		const errors: { controlName: string; message: string }[] = [];

		Object.keys(this.formGroup.controls).forEach((controlName) => {
			const control = this.formGroup.get(controlName);
			if (control?.touched && control?.invalid && control?.errors) {
				const errorKeys = Object.keys(control.errors);

				errorKeys.forEach((errorKey) => {
					let message = "";
					switch (errorKey) {
						case "required":
							message = `${controlName} is required.`;
							break;
						case "minlength":
							message = `${controlName} must be at least ${control.errors?.["minlength"].requiredLength} characters.`;
							break;
						case "maxlength":
							message = `${controlName} cannot exceed ${control.errors?.["maxlength"].requiredLength} characters.`;
							break;
						case "email":
							message = `Please enter a valid ${controlName}.`;
							break;
						default:
							message = `${controlName} has an invalid value.`;
					}
					errors.push({ controlName, message });
				});
			}
		});

		return errors;
	}
}
