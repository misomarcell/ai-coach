import { HealthProfile } from "@aicoach/shared";
import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { HealthProfileService } from "../services/health-profile.service";

export const healthProfileResolver: ResolveFn<HealthProfile | undefined> = () => {
	const healthProfileService = inject(HealthProfileService);

	return healthProfileService.getHealthProfile();
};
