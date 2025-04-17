import { Component, inject } from "@angular/core";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { Router } from "@angular/router";
import { MatRippleModule } from "@angular/material/core";

@Component({
	selector: "app-add-menu-bottom-sheet",
	standalone: true,
	imports: [MatListModule, MatButtonModule, MatIconModule, MatRippleModule],
	templateUrl: "./add-menu-bottom-sheet.component.html",
	styleUrl: "./add-menu-bottom-sheet.component.scss"
})
export class AddMenuBottomSheetComponent {
	private bottomSheetRef = inject(MatBottomSheetRef<AddMenuBottomSheetComponent>);
	private router = inject(Router);

	navigateTo(route: string, queryParams: Record<string, any> = {}): void {
		this.bottomSheetRef.dismiss();
		this.router.navigate([route], { queryParams });
	}
}
