import { UserProfile } from "@aicoach/shared";
import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { AdminUserItemComponent } from "./admin-user-item/admin-user-item.component";
import { AdminUserService } from "../services/admin-user.service";
import { tap } from "rxjs";

@Component({
	standalone: true,
	imports: [CommonModule, PageTitleComponent, AdminUserItemComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
	templateUrl: "./admin-user-list.component.html",
	styleUrl: "./admin-user-list.component.scss"
})
export class AdminUserListComponent implements OnInit {
	users = signal<UserProfile[]>([]);
	isLoading = signal<boolean>(false);
	hasMoreUsers = signal<boolean>(true);
	pageSize = 15;

	private adminUserService = inject(AdminUserService);
	private destroyRef = inject(DestroyRef);

	ngOnInit(): void {
		this.loadUsers();
	}

	loadUsers(loadMore = false): void {
		this.isLoading.set(true);

		const lastUser = loadMore ? this.users()[this.users().length - 1] : undefined;

		this.adminUserService
			.getUsers(this.pageSize, lastUser)
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				tap((newUsers) => {
					console.log({ newUsers });

					if (loadMore) {
						this.users.update((currentUsers) => [...currentUsers, ...newUsers]);
					} else {
						this.users.set(newUsers);
					}

					this.hasMoreUsers.set(newUsers.length === this.pageSize);
					this.isLoading.set(false);
				})
			)
			.subscribe();
	}

	loadMoreUsers(): void {
		if (!this.isLoading() && this.hasMoreUsers()) {
			this.loadUsers(true);
		}
	}
}
