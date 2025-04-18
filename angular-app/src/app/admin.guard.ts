import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { from, map, of, switchMap, take } from "rxjs";
import { Auth, authState } from "@angular/fire/auth";

export const isAdminGuard: CanActivateFn = () => {
	const auth = inject(Auth);
	const router = inject(Router);

	return authState(auth).pipe(
		take(1),
		switchMap((user) => (user ? from(user?.getIdTokenResult()) : of(null))),
		map((idTokenResult) => {
			const isAdmin = !!idTokenResult?.claims["admin"];

			return isAdmin ? true : router.createUrlTree(["/home"]);
		})
	);
};
