import { Component, DestroyRef, inject, output } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { MatBottomSheet, MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { map } from "rxjs/operators";
import { UserProfileService } from "../services/user-profile.service";
import { AddMenuBottomSheetComponent } from "./add-menu-bottom-sheet/add-menu-bottom-sheet.component";

@Component({
	selector: "app-bottom-toolbar",
	standalone: true,
	imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatBottomSheetModule],
	templateUrl: "./bottom-toolbar.component.html",
	styleUrl: "./bottom-toolbar.component.scss"
})
export class BottomToolbarComponent {
	private profileService = inject(UserProfileService);
	private destroyRef = inject(DestroyRef);
	private bottomSheet = inject(MatBottomSheet);

	menuToggle = output<void>();
	userPhotoUrl = toSignal(
		this.profileService.getUserProfile().pipe(
			takeUntilDestroyed(this.destroyRef),
			map((user) => user?.photoURL || undefined)
		)
	);

	toggleMenu(): void {
		this.menuToggle.emit();
	}

	openAddMenu(): void {
		this.bottomSheet.open(AddMenuBottomSheetComponent, {
			panelClass: "add-menu-bottom-sheet"
		});
	}
}
