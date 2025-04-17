import { Component, inject, input, output } from "@angular/core";
import { MatBottomSheet, MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { AddMenuBottomSheetComponent } from "./add-menu-bottom-sheet/add-menu-bottom-sheet.component";

@Component({
	selector: "app-bottom-toolbar",
	standalone: true,
	imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatBottomSheetModule],
	templateUrl: "./bottom-toolbar.component.html",
	styleUrl: "./bottom-toolbar.component.scss"
})
export class BottomToolbarComponent {
	userPhotoUrl = input<string | undefined>(undefined);
	menuToggle = output<void>();

	private bottomSheet = inject(MatBottomSheet);

	toggleMenu(): void {
		this.menuToggle.emit();
	}

	openAddMenu(): void {
		this.bottomSheet.open(AddMenuBottomSheetComponent, {
			panelClass: "add-menu-bottom-sheet"
		});
	}
}
