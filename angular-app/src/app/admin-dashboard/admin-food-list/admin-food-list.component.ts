import { Component, inject } from "@angular/core";
import { FoodSearchComponent } from "../../food-search/food-search.component";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { FoodSearchResult } from "../../services/food-search.service";
import { OverlayService } from "../../overlay/overlay.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
	imports: [PageTitleComponent, FoodSearchComponent],
	templateUrl: "./admin-food-list.component.html",
	styleUrl: "./admin-food-list.component.scss"
})
export class AdminFoodListComponent {
	private overlayService = inject(OverlayService);

	constructor() {
		takeUntilDestroyed();
	}

	onFoodSelected(food: FoodSearchResult): void {
		this.overlayService.open(() => import("../admin-food-editor/admin-food-editor.component").then((m) => m.AdminFoodEditorComponent), {
			data: { foodId: food.id }
		});
	}
}
