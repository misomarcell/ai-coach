import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { UserProfileService } from "../services/user-profile.service";
import { CronometerIntegrationComponent } from "./cronometer-integration/cronometer-integration.component";
import { TelegramIntegrationComponent } from "./telegram-integration/telegram-integration.component";
import { PageTitleComponent } from "../page-title/page-title.component";

@Component({
	imports: [PageTitleComponent, CronometerIntegrationComponent, TelegramIntegrationComponent],
	templateUrl: "./integrations-page.component.html",
	styleUrl: "./integrations-page.component.scss"
})
export class IntegrationsPageComponent {
	private activatedRoute = inject(ActivatedRoute);

	userProfile = toSignal(inject(UserProfileService).getUserProfile(this.activatedRoute.snapshot));
}
