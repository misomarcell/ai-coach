import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output, signal } from "@angular/core";
import { Storage, StorageReference, getDownloadURL, ref, uploadBytesResumable } from "@angular/fire/storage";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { catchError, EMPTY, map, take, tap } from "rxjs";
import { AuthService } from "../../services/auth.service";

@Component({
	selector: "app-calorie-vision-upload",
	imports: [
		CommonModule,
		MatCardModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatProgressBarModule,
		MatIconModule,
		MatSnackBarModule,
		MatExpansionModule,
		ReactiveFormsModule
	],
	templateUrl: "./calorie-vision-upload.component.html",
	styleUrl: "./calorie-vision-upload.component.scss"
})
export class CalorieVisionUploadComponent {
	@Output() uploadComplete = new EventEmitter<{ fileName: string; imageUrl: string }>();
	@Output() uploadStarted = new EventEmitter<void>();

	selectedFile = signal<File | null>(null);
	imagePreview = signal<string | null>(null);
	uploadPercent = signal<number | null>(null);
	uploadForm: FormGroup;
	isExpanded = true;
	loading = false;

	constructor(
		private storage: Storage,
		private authService: AuthService,
		private fb: FormBuilder,
		private snackBar: MatSnackBar
	) {
		this.uploadForm = this.fb.group({
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

		this.loading = true;
		this.uploadPercent.set(0);
		this.uploadStarted.emit();

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
					this.loading = false;
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
		if (!this.selectedFile()) throw new Error("No file selected");

		const pathSegments = fileRef.fullPath.split("/");
		const fileName = pathSegments[pathSegments.length - 1];

		const task = uploadBytesResumable(fileRef, this.selectedFile()!, {
			customMetadata: { uid, description: this.uploadForm.get("description")?.value }
		});

		task.on(
			"state_changed",
			(snapshot) => {
				const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				this.uploadPercent.set(progress);
			},
			(error) => {
				this.loading = false;
				this.snackBar.open("Upload failed: " + error.message, "Close", {
					duration: 5000
				});
			},
			() => {
				getDownloadURL(fileRef).then((url) => {
					this.loading = false;
					this.isExpanded = false;

					this.snackBar.open("Image uploaded successfully! Waiting for analysis...", "Close", {
						duration: 3000
					});

					this.uploadComplete.emit({
						fileName: fileName,
						imageUrl: url
					});

					this.resetFileInput();
				});
			}
		);
	}

	private getFileRef(uid: string): StorageReference {
		const timestamp = new Date().getTime();
		const fileExt = this.selectedFile?.name.split(".").pop();
		const filename = `${timestamp}.${fileExt}`;
		const filePath = `calorie-vision/${uid}/${filename}`;

		return ref(this.storage, filePath);
	}
}
