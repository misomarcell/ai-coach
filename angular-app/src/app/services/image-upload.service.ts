import { inject, Injectable } from "@angular/core";
import { ref, Storage, StorageReference, uploadBytesResumable, UploadTask } from "@angular/fire/storage";
import { MatSnackBar } from "@angular/material/snack-bar";
import { NgxImageCompressService } from "ngx-image-compress";
import { BehaviorSubject, filter, Observable, take } from "rxjs";
import { AuthService } from "./auth.service";

export interface ImageUploadResult {
	downloadUrl: string;
	filePath: string;
}

@Injectable({
	providedIn: "root"
})
export class ImageUploadService {
	private storage = inject(Storage);
	private authService = inject(AuthService);
	private imageCompress = inject(NgxImageCompressService);
	private snackBar = inject(MatSnackBar);

	private uploadProgressSubject = new BehaviorSubject<number | null>(null);
	uploadProgress$ = this.uploadProgressSubject.asObservable();

	/**
	 * Compresses an image file for more efficient storage
	 * @param file The image file to compress
	 * @returns A compressed file or null if compression fails
	 */
	async compressImage(file: File, maxWidth = 1280): Promise<File | null> {
		try {
			const dataUrl = await this.readFileAsDataUrl(file);
			const orientation = await this.imageCompress.getOrientation(file);
			const compressedDataUrl = await this.imageCompress.compressFile(dataUrl, orientation, 50, 50, maxWidth);
			const blob = this.dataUrlToBlob(compressedDataUrl);

			return new File([blob], file.name, {
				type: blob.type,
				lastModified: Date.now()
			});
		} catch (err) {
			console.error("Image compression failed", err);
			this.snackBar.open("Image compression failed", "Close", {
				duration: 5000
			});

			return null;
		}
	}

	/**
	 * Validates if the selected file is a valid image with appropriate size
	 * @param file The file to validate
	 * @param maxSizeMB The maximum file size in MB
	 * @returns boolean indicating if the file is valid
	 */
	validateImageFile(file: File, maxSizeMB = 10): boolean {
		if (!file.type.match(/image\/(jpeg|jpg|png|bmp|webp)/)) {
			this.snackBar.open("Please select a valid image file (JPEG, PNG, BMP, WEBP)", "Close", { duration: 5000 });
			return false;
		}

		if (file.size > maxSizeMB * 1024 * 1024) {
			this.snackBar.open(`Image is too large. Maximum size is ${maxSizeMB}MB`, "Close", {
				duration: 5000
			});
			return false;
		}

		return true;
	}

	/**
	 * Uploads an image to the specified storage path
	 * @param file The file to upload
	 * @param storagePath The path in storage to upload to (e.g. 'profile-pictures')
	 * @param metadata Optional metadata to include with the file
	 * @returns An observable that emits the download URL when complete
	 */
	uploadImage(file: File, storagePath: string, metadata?: Record<string, string>): Observable<ImageUploadResult> {
		this.uploadProgressSubject.next(0);

		return new Observable<ImageUploadResult>((observer) => {
			this.authService.uid
				.pipe(
					filter((uid) => !!uid),
					take(1)
				)
				.subscribe((uid) => {
					if (!uid) {
						observer.error(new Error("User not authenticated"));
						return;
					}

					const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
					const filePath = `${storagePath}/${uid}/${filename}`;
					const fileRef = ref(this.storage, filePath);
					const task = this.startUploadTask(fileRef, file, metadata || {});

					task.on(
						"state_changed",
						(snapshot) => {
							const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
							this.uploadProgressSubject.next(progress);
						},
						(error) => {
							this.uploadProgressSubject.next(null);
							observer.error(error);
						},
						async () => {
							try {
								const downloadUrl = await this.getDownloadURL(fileRef);
								this.uploadProgressSubject.next(100);
								observer.next({ downloadUrl, filePath });
								observer.complete();
							} catch (error) {
								observer.error(error);
							}
						}
					);
				});
		});
	}

	private readFileAsDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === "string") resolve(reader.result);
				else reject(new Error("Unexpected FileReader result"));
			};
			reader.onerror = () => reject(new Error("FileReader error"));
			reader.readAsDataURL(file);
		});
	}

	private dataUrlToBlob(dataUrl: string): Blob {
		const [header, base64] = dataUrl.split(",");
		const mime = header.match(/:(.*?);/)?.[1] || "";
		const bin = atob(base64);
		const buf = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
		return new Blob([buf], { type: mime });
	}

	private startUploadTask(fileRef: StorageReference, file: File, metadata: Record<string, string>): UploadTask {
		return uploadBytesResumable(fileRef, file, {
			customMetadata: metadata
		});
	}

	private async getDownloadURL(fileRef: StorageReference): Promise<string> {
		try {
			const { getDownloadURL } = await import("@angular/fire/storage");
			return await getDownloadURL(fileRef);
		} catch (error) {
			console.error("Error getting download URL", error);
			throw error;
		}
	}
}
