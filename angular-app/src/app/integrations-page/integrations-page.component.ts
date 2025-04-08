import { AsyncPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { UserService } from "../services/user.service";
import { CronometerIntegrationComponent } from "./cronometer-integration/cronometer-integration.component";
import { TelegramIntegrationComponent } from "./telegram-integration/telegram-integration.component";

@Component({
	imports: [AsyncPipe, CronometerIntegrationComponent, TelegramIntegrationComponent],
	templateUrl: "./integrations-page.component.html",
	styleUrl: "./integrations-page.component.scss"
})
export class IntegrationsPageComponent {
	userProfile$ = inject(UserService).getUserProfile$();
}
