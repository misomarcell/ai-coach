import { UserProfile } from "@aicoach/shared";
import { inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ResolveFn } from "@angular/router";
import { catchError, from, of, retry, switchMap, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";
import { UserProfileService } from "../services/user-profile.service";

export const userProfileResolver: ResolveFn<UserProfile | undefined> = () => {
	const authService = inject(AuthService);
	const snackBar = inject(MatSnackBar);
	const userService = inject(UserProfileService);

	return userService.getUserProfile().pipe(
		switchMap((profile) => {
			if (!profile) {
				return throwError(() => new Error("User profile not found"));
			}

			return of(profile);
		}),
		retry({
			count: 5,
			delay: 1000
		}),
		catchError((error) => {
			console.error("Error fetching user profile:", error);
			const snackRef = snackBar.open("Error fetching your profile. Please try again or get in touch with us.", "OK", {
				panelClass: "snackbar-error",
				duration: 6000
			});

			return snackRef.afterDismissed().pipe(switchMap(() => from(authService.logout(["login"]).then(() => undefined))));
		})
	);
};
