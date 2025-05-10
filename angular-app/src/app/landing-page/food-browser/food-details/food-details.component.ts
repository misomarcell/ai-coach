import { FULLSCREEN_OVERLAY_DATA, FullscreenOverlayRef } from "@aicoach/overlay";
import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { Router } from "@angular/router";
import { DietaryFlagsComponent } from "../../../dietary-flags/dietary-flags.component";
import { NutritionLabelComponent } from "../../../nutrition-label/nutrition-label.component";
import { NutritionListComponent } from "../../../nutrition-list/nutrition-list.component";
import { FoodSearchResult } from "../../../services/food-search.service";
import { EditServingFormComponent } from "../../../servings/edit-serving-form/edit-serving-form.component";

@Component({
	imports: [NutritionLabelComponent, NutritionListComponent, DietaryFlagsComponent, MatButtonModule, MatIconModule],
	templateUrl: "./food-details.component.html",
	styleUrl: "./food-details.component.scss"
})
export class FoodDetailsComponent {
	overlayRef = inject(FullscreenOverlayRef<EditServingFormComponent>);
	overlayData = inject<{ foodResult: FoodSearchResult }>(FULLSCREEN_OVERLAY_DATA);

	private router = inject(Router);

	registerClick() {
		this.closeOverlay();
		this.router.navigate(["/register"]);
	}

	closeOverlay() {
		this.overlayRef.close();
	}
}
