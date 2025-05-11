import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { AppMenuModule } from "../../menu";
import { PageTitleComponent } from "../../page-title/page-title.component";

@Component({
	imports: [RouterLink, PageTitleComponent, AppMenuModule, MatIconModule],
	templateUrl: "./legal-menu.component.html",
	styleUrl: "./legal-menu.component.scss"
})
export class LegalMenuComponent {}
