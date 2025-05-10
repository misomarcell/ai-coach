import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

@Component({
	selector: "app-database-demo",
	imports: [RouterLink, MatButtonModule, MatIconModule],
	templateUrl: "./database-demo.component.html",
	styleUrl: "./database-demo.component.scss"
})
export class DatabaseDemoComponent {}
