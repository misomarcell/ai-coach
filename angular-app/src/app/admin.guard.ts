import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map } from "rxjs";
import { AuthService } from "./services/auth.service";

export const isAdminGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const router = inject(Router);

	return authService.isAdmin().pipe(map((isAdmin) => (isAdmin ? true : router.createUrlTree(["/not-found"]))));
};
