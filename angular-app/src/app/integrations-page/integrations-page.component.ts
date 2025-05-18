import { Component, inject } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute } from "@angular/router";
import { PageTitleComponent } from "../page-title/page-title.component";
import { CronometerIntegrationComponent } from "./cronometer-integration/cronometer-integration.component";
import { TelegramIntegrationComponent } from "./telegram-integration/telegram-integration.component";

@Component({
	imports: [PageTitleComponent, CronometerIntegrationComponent, TelegramIntegrationComponent, MatExpansionModule, MatIconModule],
	templateUrl: "./integrations-page.component.html",
	styleUrl: "./integrations-page.component.scss"
})
export class IntegrationsPageComponent {
	private activatedRoute = inject(ActivatedRoute);

	userProfile = this.activatedRoute.snapshot.data["userProfile"];
}
