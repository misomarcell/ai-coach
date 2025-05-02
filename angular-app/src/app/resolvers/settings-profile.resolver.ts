import { SettingsProfile } from "@aicoach/shared";
import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { catchError, of } from "rxjs";
import { SettingsProfileService } from "../services/settings-profile.service";

export const settingsProfileResolver: ResolveFn<SettingsProfile | undefined> = () => {
	const settingsProfileService = inject(SettingsProfileService);
	
	return settingsProfileService.getSettingsProfile().pipe(
		catchError(() => of(undefined))
	);
};