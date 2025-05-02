import { HealthProfile, SettingsProfile, UserProfile } from "@aicoach/shared";
import { DatePipe } from "@angular/common";
import { Component, DestroyRef, inject, input, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatCardModule } from "@angular/material/card";
import { MatRippleModule } from "@angular/material/core";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { AdminUserService } from "../../services/admin-user.service";

@Component({
	selector: "app-admin-user-item",
	standalone: true,
	imports: [DatePipe, MatExpansionModule, MatCardModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule, MatRippleModule],
	templateUrl: "./admin-user-item.component.html",
	styleUrl: "./admin-user-item.component.scss"
})
export class AdminUserItemComponent {
	user = input.required<UserProfile>();
	settings = signal<SettingsProfile | undefined>(undefined);
	healthProfile = signal<HealthProfile | undefined>(undefined);
	isLoading = signal<boolean>(false);
	isExpanded = signal<boolean>(false);

	private adminUserService = inject(AdminUserService);
	private destroyRef = inject(DestroyRef);

	onPanelOpened(): void {
		this.isExpanded.set(true);
		this.loadHealthProfile();
		this.loadSettingsProfile();
	}

	onPanelClosed(): void {
		this.isExpanded.set(false);
	}

	private loadHealthProfile(): void {
		if (!this.healthProfile() && this.user()?.id) {
			this.isLoading.set(true);

			this.adminUserService
				.getUserHealthProfile(this.user().id)
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe({
					next: (profile) => {
						this.healthProfile.set(profile);
						this.isLoading.set(false);
					},
					error: (error) => {
						console.error(`Error loading health profile for user ${this.user().id}:`, error);
						this.isLoading.set(false);
					}
				});
		}
	}

	private loadSettingsProfile(): void {
		if (!this.settings() && this.user()?.id) {
			this.isLoading.set(true);

			this.adminUserService
				.getUserSettingsProfile(this.user().id)
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe({
					next: (profile) => {
						this.settings.set(profile);
						this.isLoading.set(false);
					},
					error: (error) => {
						console.error(`Error loading settings profile for user ${this.user().id}:`, error);
						this.isLoading.set(false);
					}
				});
		}
	}
}
