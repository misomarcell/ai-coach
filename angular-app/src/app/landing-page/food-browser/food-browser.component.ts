import { OverlayService } from "@aicoach/overlay";
import { Component, inject } from "@angular/core";
import { FoodSearchComponent } from "../../food-search/food-search.component";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { FoodSearchResult } from "../../services/food-search.service";
import { FoodDetailsComponent } from "./food-details/food-details.component";

@Component({
	imports: [PageTitleComponent, FoodSearchComponent],
	templateUrl: "./food-browser.component.html",
	styleUrl: "./food-browser.component.scss"
})
export class FoodBrowserComponent {
	private overlayService = inject(OverlayService);

	onFoodSelected(result: FoodSearchResult) {
		this.overlayService.open(FoodDetailsComponent, {
			data: {
				foodResult: result
			}
		});
	}
}
