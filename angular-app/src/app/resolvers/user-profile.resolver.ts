import { UserProfile } from "@aicoach/shared";
import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { catchError, of } from "rxjs";
import { UserProfileService } from "../services/user-profile.service";

export const userProfileResolver: ResolveFn<UserProfile | undefined> = () => {
	const userService = inject(UserProfileService);

	return userService.getUserProfile().pipe(catchError(() => of(undefined)));
};
