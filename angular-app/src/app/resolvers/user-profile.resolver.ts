import { UserProfile } from "@aicoach/shared";
import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { UserService } from "../services/user.service";

export const userProfileResolver: ResolveFn<UserProfile | undefined> = () => {
	const userService = inject(UserService);

	return userService.getUserProfile$();
};
