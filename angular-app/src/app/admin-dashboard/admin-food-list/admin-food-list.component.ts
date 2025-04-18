import { Component } from "@angular/core";
import { FoodSearchComponent } from "../../food-search/food-search.component";
import { PageTitleComponent } from "../../page-title/page-title.component";

@Component({
	imports: [PageTitleComponent, FoodSearchComponent],
	templateUrl: "./admin-food-list.component.html",
	styleUrl: "./admin-food-list.component.scss"
})
export class AdminFoodListComponent {}
