import { Routes } from "@angular/router";
import { isAdminGuard } from "./admin.guard";
import { loggedInGuard, loggedOutGuard } from "./auth.guard";
import { dailyTargetsResolver } from "./resolvers/daily-targets.resolver";
import { healthProfileResolver } from "./resolvers/health-profile.resolver";
import { servingsResolver } from "./resolvers/servings.resolver";
import { userProfileResolver } from "./resolvers/user-profile.resolver";

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
				resolve: {
					servings: servingsResolver,
					dailyTargets: dailyTargetsResolver
				}
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
				resolve: { userProfile: userProfileResolver },
				children: [
					{
						path: "",
						loadComponent: () =>
							import("./user-profile/profile-menu/profile-menu.component").then((m) => m.ProfileMenuComponent)
					},
					{
						path: "health-profile",
						loadComponent: () =>
							import("./user-profile/health-profile/health-profile.component").then((m) => m.HealthProfileComponent),
						resolve: { healthProfile: healthProfileResolver }
					},
					{
						path: "integrations",
						loadComponent: () =>
							import("./integrations-page/integrations-page.component").then((m) => m.IntegrationsPageComponent),
						canActivate: [loggedInGuard],
						resolve: { userProfile: userProfileResolver }
					}
				]
			},
			{
				path: "admin-dashboard",
				loadComponent: () => import("./admin-dashboard/admin-dashboard.component").then((m) => m.AdminDashboardComponent),
				canActivate: [loggedInGuard, isAdminGuard]
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
		path: "register",
		loadComponent: () => import("./register/register.component").then((m) => m.RegisterComponent),
		canActivate: [loggedOutGuard]
	},
	{
		path: "forgot-password",
		loadComponent: () => import("./forgot-password/forgot-password.component").then((m) => m.ForgotPasswordComponent),
		canActivate: [loggedOutGuard]
	},
	{
		path: "**",
		loadComponent: () => import("./not-found/not-found.component").then((m) => m.NotFoundComponent)
	}
];
