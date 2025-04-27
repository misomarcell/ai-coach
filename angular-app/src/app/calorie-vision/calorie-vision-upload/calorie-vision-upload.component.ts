import { DecimalPipe } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ref, Storage, StorageReference, uploadBytesResumable } from "@angular/fire/storage";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { Router, RouterLink } from "@angular/router";
import { catchError, EMPTY, filter, map, take, tap } from "rxjs";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { AuthService } from "../../services/auth.service";
import { CalorieVisionService } from "../calorie-vision.service";

@Component({
	selector: "app-calorie-vision-upload",
	imports: [
		RouterLink,
		PageTitleComponent,
		DecimalPipe,
		MatCardModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatProgressBarModule,
		MatProgressSpinnerModule,
		MatIconModule,
		MatSnackBarModule,
		ReactiveFormsModule
	],
	templateUrl: "./calorie-vision-upload.component.html",
	styleUrl: "./calorie-vision-upload.component.scss"
})
export class CalorieVisionUploadComponent {
	private storage = inject(Storage);
	private destroyRef = inject(DestroyRef);
	private router = inject(Router);
	private calorieVisionService = inject(CalorieVisionService);
	private authService = inject(AuthService);
	private formBuilder = inject(FormBuilder);
	private snackBar = inject(MatSnackBar);

	isLoading = signal(false);
	documentId = toSignal(this.calorieVisionService.getNewDocument());
	selectedFile = signal<File | null>(null);
	imagePreview = signal<string | null>(null);
	uploadPercent = signal<number | null>(null);
	uploadForm: FormGroup;
	isExpanded = true;

	constructor() {
		this.uploadForm = this.formBuilder.group({
			image: [null],
			description: [null]
		});
	}

	toggleExpansion() {
		this.isExpanded = !this.isExpanded;
	}

	onFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			this.selectedFile.set(input.files[0]);

			if (!this.selectedFile()!.type.match(/image\/(jpeg|jpg|png|gif|bmp|webp)/)) {
				this.snackBar.open("Please select a valid image file (JPEG, PNG, GIF, BMP, WEBP)", "Close", {
					duration: 5000
				});
				this.resetFileInput();
				return;
			}

			if (this.selectedFile()!.size > 10 * 1024 * 1024) {
				this.snackBar.open("Image is too large. Maximum size is 10MB", "Close", {
					duration: 5000
				});
				this.resetFileInput();
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				this.imagePreview.set(`${reader.result}`);
			};

			reader.readAsDataURL(this.selectedFile()!);
		}
	}

	uploadImage() {
		if (!this.selectedFile()) throw new Error("No file selected");

		this.isLoading.set(true);
		this.uploadPercent.set(0);

		this.authService.uid
			.pipe(
				take(1),
				map((uid) => {
					if (!uid) {
						throw new Error("User is not authenticated");
					}

					return uid;
				}),
				tap((uid) => this.startUploadTask(this.getFileRef(uid!), uid!)),
				catchError((error) => {
					this.isLoading.set(false);
					this.snackBar.open("Upload failed: " + error.message, "Close", {
						duration: 5000
					});

					return EMPTY;
				})
			)
			.subscribe();
	}

	resetFileInput() {
		this.uploadForm.reset();
		this.selectedFile.set(null);
		this.imagePreview.set(null);
		this.uploadPercent.set(null);
	}

	private startUploadTask(fileRef: StorageReference, uid: string): void {
		const selectedFile = this.selectedFile();
		const documentId = this.documentId();

		if (!selectedFile) throw new Error("No file selected");
		if (!documentId) throw new Error("No document ID available");

		console.log("Full path:", fileRef.fullPath);

		const pathSegments = fileRef.fullPath.split("/");
		const fileName = pathSegments[pathSegments.length - 1];
		const description = this.uploadForm.get("description")?.value;
		const task = uploadBytesResumable(fileRef, selectedFile, {
			customMetadata: { uid, description }
		});

		task.on(
			"state_changed",
			(snapshot) => {
				const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				this.uploadPercent.set(progress);
			},
			(error) => {
				this.isLoading.set(false);
				this.snackBar.open("Upload failed: " + error.message, "Close", {
					duration: 5000
				});
			},
			() =>
				this.calorieVisionService
					.submitDocument(documentId, fileName, description)
					.pipe(
						takeUntilDestroyed(this.destroyRef),
						catchError(() => {
							this.isLoading.set(false);
							this.snackBar.open("Faield to submit. Please try again later.", "Close");

							return EMPTY;
						}),
						filter((submittedId) => !!submittedId),
						tap((submittedId) => {
							this.isLoading.set(false);
							this.router.navigate(["/calorie-vision", submittedId]);
						})
					)
					.subscribe()
		);
	}

	private getFileRef(uid: string): StorageReference {
		const timestamp = new Date().getTime();
		const filename = `${timestamp}`;
		const filePath = `calorie-vision/${uid}/${filename}`;

		return ref(this.storage, filePath);
	}
}
