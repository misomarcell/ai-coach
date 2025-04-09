import { Routes } from "@angular/router";
import { loggedInGuard, loggedOutGuard } from "./auth.guard";
import { userProfileResolver } from "./user-profile.resolver";

export const routes: Routes = [
	{
		path: "",
		loadComponent: () => import("./app-shell/app-shell.component").then((m) => m.AppShellComponent),
		children: [
			{
				path: "diet-analyses",
				loadComponent: () => import("./diet-analyses-page/diet-analyses-page.component").then((m) => m.DietAnalysesPageComponent),
				canActivate: [loggedInGuard]
			},
			{
				path: "home",
				loadComponent: () => import("./home/home.component").then((m) => m.HomeComponent),
				canActivate: [loggedInGuard],
				resolve: { userProfile: userProfileResolver }
			},
			{
				path: "calorie-vision",
				loadComponent: () => import("./calorie-vision/calorie-vision.component").then((m) => m.CalorieVisionComponent),
				canActivate: [loggedInGuard]
			},
			{
				path: "scan",
				loadComponent: () => import("./scanner-page/scanner-page.component").then((m) => m.ScannerPageComponent)
			},
			{
				path: "add-food",
				loadComponent: () => import("./add-food/add-food.component").then((m) => m.AddFoodComponent),
				canActivate: [loggedInGuard]
			},
			{
				path: "add-food/:foodId",
				loadComponent: () => import("./add-food/add-food.component").then((m) => m.AddFoodComponent),
				canActivate: [loggedInGuard]
			},
			{
				path: "search-food",
				loadComponent: () => import("./food-list/food-list.component").then((m) => m.FoodListComponent),
				canActivate: [loggedInGuard]
			},
			{
				path: "profile",
				loadComponent: () => import("./user-profile/user-profile.component").then((m) => m.UserProfileComponent),
				canActivate: [loggedInGuard],
				resolve: { userProfile: userProfileResolver }
			},
			{
				path: "integrations",
				loadComponent: () => import("./integrations-page/integrations-page.component").then((m) => m.IntegrationsPageComponent),
				canActivate: [loggedInGuard]
			},
			{
				path: "",
				redirectTo: "home",
				pathMatch: "full"
			}
		]
	},
	{
		path: "not-found",
		loadComponent: () => import("./not-found/not-found.component").then((m) => m.NotFoundComponent)
	},
	{
		path: "login",
		loadComponent: () => import("./login/login.component").then((m) => m.LoginComponent),
		canActivate: [loggedOutGuard]
	},
	{
		path: "**",
		loadComponent: () => import("./not-found/not-found.component").then((m) => m.NotFoundComponent)
	}
];
