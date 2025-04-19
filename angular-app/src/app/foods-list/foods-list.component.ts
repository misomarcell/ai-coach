import { OverlayService } from "@aicoach/overlay";
import { Component, inject } from "@angular/core";
import { FoodSearchComponent } from "../food-search/food-search.component";
import { FoodSearchResult } from "../services/food-search.service";
import { EditServingFormComponent } from "../servings/edit-serving-form/edit-serving-form.component";

@Component({
	selector: "app-foods-list",
	imports: [FoodSearchComponent],
	templateUrl: "./foods-list.component.html",
	styleUrl: "./foods-list.component.scss"
})
export class FoodsListComponent {
	private overlayService = inject(OverlayService);

	async onFoodSelected(foodSearchResult: FoodSearchResult): Promise<void> {
		await this.overlayService.open(EditServingFormComponent, {
			data: {
				foodId: foodSearchResult.id
			}
		});
	}
}
