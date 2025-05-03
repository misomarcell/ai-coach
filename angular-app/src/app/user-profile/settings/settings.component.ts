import { aiModels, SettingsProfile, UserProfile } from "@aicoach/shared";
import { NgStyle } from "@angular/common";
import { Component, DestroyRef, ElementRef, inject, signal, ViewChild } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRippleModule } from "@angular/material/core";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, EMPTY, filter, finalize, from, map, Observable, of, switchMap, take, tap } from "rxjs";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { AuthService } from "../../services/auth.service";
import { ImageUploadService } from "../../services/image-upload.service";
import { SettingsProfileService } from "../../services/settings-profile.service";
import { UserProfileService } from "../../services/user-profile.service";

@Component({
	imports: [
		NgStyle,
		PageTitleComponent,
		ReactiveFormsModule,
		FormsModule,
		MatFormFieldModule,
		MatRippleModule,
		MatInputModule,
		MatButtonModule,
		MatProgressSpinnerModule,
		MatDividerModule,
		MatIconModule,
		MatCardModule,
		MatSelectModule,
		MatCheckboxModule
	],
	templateUrl: "./settings.component.html",
	styleUrl: "./settings.component.scss"
})
export class SettingsComponent {
	private router = inject(Router);
	private formBuilder = inject(FormBuilder);
	private authService = inject(AuthService);
	private destroyRef = inject(DestroyRef);
	private settingsProfileService = inject(SettingsProfileService);
	private profileService = inject(UserProfileService);
	private snackBar = inject(MatSnackBar);
	private actiavtedRoute = inject(ActivatedRoute);
	private imageUploadService = inject(ImageUploadService);

	formGroup: FormGroup;
	lastUpdated = signal<Date | undefined>(undefined);
	currentEmail: string | undefined = undefined;
	currentPhotoURL: string | undefined = undefined;
	isLoading = signal(false);
	isSubmitting = signal(false);
	isUploading = signal(false);
	isEmailVerified = toSignal(
		this.authService.getCurrentUser().pipe(
			take(1),
			filter((user) => !!user),
			map((user) => user.emailVerified)
		)
	);

	uploadProgress = signal<number>(0);
	imagePreview = signal<string | null>(null);
	selectedFile = signal<File | null>(null);

	aiModels = aiModels;

	@ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;
	constructor() {
		this.formGroup = this.formBuilder.group({
			displayName: ["", [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
			email: ["", [Validators.required, Validators.email]],
			receiveNewsAndUpdates: [true],
			aiModel: [aiModels[0], [Validators.required]]
		});

		this.isLoading.set(true);

		const userProfile = this.actiavtedRoute.snapshot.data["userProfile"] as UserProfile;
		if (userProfile) {
			this.formGroup.patchValue(userProfile);

			this.currentEmail = userProfile.email;
			this.currentPhotoURL = userProfile.photoURL;
		}

		const settingsProfile = this.actiavtedRoute.snapshot.data["settingsProfile"] as SettingsProfile;
		if (settingsProfile) {
			this.formGroup.patchValue(settingsProfile);
			this.lastUpdated.set(settingsProfile.lastUpdated);
			this.isLoading.set(false);
		}

		this.isLoading.set(false);
	}

	openFileSelector(): void {
		if (this.isUploading()) {
			return;
		}

		this.fileInput.nativeElement.click();
	}

	async onFileSelected(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length || this.isUploading()) {
			return;
		}

		const file = input.files[0];

		if (!this.imageUploadService.validateImageFile(file, 5)) {
			this.resetFileInput();
			return;
		}

		const reader = new FileReader();
		reader.onload = () => this.imagePreview.set(reader.result as string);
		reader.readAsDataURL(file);

		try {
			const compressed = await this.imageUploadService.compressImage(file, 512);
			this.selectedFile.set(compressed || file);

			this.uploadProfilePicture();
		} catch (error) {
			console.error("Error processing image", error);
			this.snackBar.open("Failed to process image", "Close", { panelClass: "snackbar-error" });
			this.resetFileInput();
		}
	}

	uploadProfilePicture(): void {
		const file = this.selectedFile();
		if (!file || this.isUploading()) {
			return;
		}

		this.isUploading.set(true);

		this.imageUploadService.uploadProgress$
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				tap((progress) => {
					if (progress !== null) {
						this.uploadProgress.set(progress);
					}
				})
			)
			.subscribe();

		this.imageUploadService
			.uploadImage(file, "profile-pictures", { type: "avatar" })
			.pipe(
				take(1),
				tap((downloadUrl) => {
					this.formGroup.patchValue({ photoURL: downloadUrl });
					this.snackBar.open("Profile picture updated successfully", "Close");
				}),
				switchMap(({ downloadUrl }) => this.profileService.updateUserProfile({ photoURL: downloadUrl })),
				catchError((error) => {
					console.error("Error uploading profile picture", error);
					this.snackBar.open("Failed to upload profile picture", "Close", { panelClass: "snackbar-error" });
					this.isUploading.set(false);
					this.resetFileInput();

					return of(null);
				}),
				finalize(() => {
					this.isUploading.set(false);
					this.resetFileInput();
				})
			)
			.subscribe();
	}

	resetFileInput(): void {
		this.selectedFile.set(null);
		if (this.fileInput?.nativeElement) {
			this.fileInput.nativeElement.value = "";
		}
	}

	onSubmit(): void {
		if (this.formGroup.invalid) {
			return;
		}

		this.isSubmitting.set(true);

		const formValues = this.formGroup.value;
		const settingsData: SettingsProfile = {
			receiveNewsAndUpdates: formValues.receiveNewsAndUpdates,
			aiModel: formValues.aiModel,
			lastUpdated: new Date()
		};

		const profileData: Partial<UserProfile> = {
			displayName: formValues.displayName,
			email: formValues.email
		};

		this.profileService
			.updateUserProfile(profileData)
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				switchMap(() => this.settingsProfileService.setSettingsProfile(settingsData)),
				switchMap(() => (formValues.email !== this.currentEmail ? this.updateUserEmail(formValues.email) : of(true))),
				take(1),
				switchMap(() => {
					this.snackBar.open("Your settings have been updated successfully", "Close");

					return from(this.router.navigate(["/profile"]));
				}),
				catchError((error) => {
					console.error("Error updating settings", error);
					this.snackBar.open(`Failed to update settings. Please try again.`, "Close");

					return of(EMPTY);
				}),
				finalize(() => this.isSubmitting.set(false))
			)
			.subscribe();
	}

	getErrorsFor(controlName: string): string {
		const control = this.formGroup.get(controlName);
		if (!control) {
			return "";
		}

		if (control.hasError("required")) {
			return "This field is required";
		}

		if (control.hasError("email")) {
			return "Please enter a valid email address";
		}

		if (control.hasError("minlength")) {
			const minLength = control.getError("minlength").requiredLength;
			return `Minimum length is ${minLength} characters`;
		}

		if (control.hasError("maxlength")) {
			const maxLength = control.getError("maxlength").requiredLength;
			return `Maximum length is ${maxLength} characters`;
		}

		return "Invalid value";
	}

	private updateUserEmail(newEmail: string): Observable<void> {
		return this.authService.updateEmail(newEmail);
	}
}
