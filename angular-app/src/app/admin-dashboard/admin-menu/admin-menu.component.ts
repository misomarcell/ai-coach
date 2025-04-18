import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

@Component({
	selector: "app-admin-menu",
	imports: [RouterLink, MatIconModule],
	templateUrl: "./admin-menu.component.html",
	styleUrl: "./admin-menu.component.scss"
})
export class AdminMenuComponent {}
