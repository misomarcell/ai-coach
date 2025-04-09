import { Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ServingsListComponent } from "../servings/servings-list/servings-list.component";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [ServingsListComponent, MatProgressSpinnerModule, MatCardModule],
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss"
})
export class HomeComponent {}
