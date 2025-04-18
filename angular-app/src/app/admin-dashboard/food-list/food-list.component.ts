import { Component } from "@angular/core";
import { PageTitleComponent } from "../../page-title/page-title.component";

@Component({
	selector: "app-food-list",
	imports: [PageTitleComponent],
	templateUrl: "./food-list.component.html",
	styleUrl: "./food-list.component.scss"
})
export class FoodListComponent {}
