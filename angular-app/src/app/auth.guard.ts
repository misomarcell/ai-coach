import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { from, of, switchMap } from "rxjs";

import { AuthService } from "./services/auth.service";

export const loggedInGuard: CanActivateFn = () => {
	const router = inject(Router);
	const authService = inject(AuthService);

	return authService.uid.pipe(switchMap((uid) => (uid ? of(true) : from(router.navigate(["login"])))));
};

export const loggedOutGuard: CanActivateFn = () => {
	const router = inject(Router);
	const authService = inject(AuthService);

	return authService.uid.pipe(switchMap((uid) => (!uid ? of(true) : from(router.navigate(["home"])))));
};
