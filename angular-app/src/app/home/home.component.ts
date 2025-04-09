import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { map } from "rxjs";
import { ServingsListComponent } from "../servings/servings-list/servings-list.component";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [ServingsListComponent, MatProgressSpinnerModule, MatCardModule],
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss"
})
export class HomeComponent {
	private route = inject(ActivatedRoute);
	currentServings = toSignal(this.route.data.pipe(map((data) => data["servings"] ?? [])));
}
