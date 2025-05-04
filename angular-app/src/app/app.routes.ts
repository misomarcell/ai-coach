import { Routes } from "@angular/router";
import { isAdminGuard } from "./admin.guard";
import { loggedInGuard, loggedOutGuard } from "./auth.guard";
import { analysisResolver } from "./resolvers/analysis.resolver";
import { calorieVisionResolver } from "./resolvers/calorie-vision.resolver";
import { dailyTargetsResolver } from "./resolvers/daily-targets.resolver";
import { healthProfileResolver } from "./resolvers/health-profile.resolver";
import { settingsProfileResolver } from "./resolvers/settings-profile.resolver";
import { servingsResolver } from "./resolvers/servings.resolver";
import { userProfileResolver } from "./resolvers/user-profile.resolver";
import { visionHistoryResolver } from "./resolvers/vision-history.resolver";

export const routes: Routes = [
	{
		path: "",
		loadComponent: () => import("./app-shell/app-shell.component").then((m) => m.AppShellComponent),
		children: [
			{
				path: "diet-analyses",
				loadComponent: () => import("./diet-analyses-page/diet-analyses-page.component").then((m) => m.DietAnalysesPageComponent),
				canActivate: [loggedInGuard],
				children: [
					{
						path: "",
						loadComponent: () =>
							import("./diet-analyses-page/analysis-result-list/analysis-result-list.component").then(
								(m) => m.AnalysisResultListComponent
							)
					},
					{
						path: ":analysisId",
						loadComponent: () =>
							import("./diet-analyses-page/analysis-details-page/analysis-details-page.component").then(
								(m) => m.AnalysisDetailsPageComponent
							),
						resolve: { analysis: analysisResolver }
					}
				]
			},
			{
				path: "dashboard",
				loadComponent: () => import("./dashboard/dashboard.component").then((m) => m.DashboardComponent),
				canActivate: [loggedInGuard],
				resolve: {
					servings: servingsResolver,
					dailyTargets: dailyTargetsResolver
				}
			},
			{
				path: "calorie-vision",
				loadComponent: () => import("./calorie-vision/calorie-vision.component").then((m) => m.CalorieVisionComponent),
				canActivate: [loggedInGuard],
				children: [
					{
						path: "",
						loadComponent: () =>
							import("./calorie-vision/calorie-vision-upload/calorie-vision-upload.component").then(
								(m) => m.CalorieVisionUploadComponent
							)
					},
					{
						path: "history",
						loadComponent: () =>
							import("./calorie-vision/calorie-vision-result-list/calorie-vision-result-list.component").then(
								(m) => m.CalorieVisionResultListComponent
							),
						resolve: { visionHistory: visionHistoryResolver }
					},
					{
						path: ":visionId",
						loadComponent: () =>
							import("./calorie-vision/calorie-vision-result/calorie-vision-result.component").then(
								(m) => m.CalorieVisionResultComponent
							),
						resolve: { calorieVision: calorieVisionResolver }
					}
				]
			},
			{
				path: "scan",
				loadComponent: () => import("./scanner-page/scanner-page.component").then((m) => m.ScannerPageComponent)
			},
			{
				path: "scan/:barcode",
				loadComponent: () => import("./product-result/product-result.component").then((m) => m.ProductResultComponent)
			},
			{
				path: "foods",
				loadComponent: () => import("./foods-page/foods-page.component").then((m) => m.FoodsPageComponent),
				canActivate: [loggedInGuard],
				children: [
					{
						path: "",
						loadComponent: () => import("./foods-list/foods-list.component").then((m) => m.FoodsListComponent)
					},
					{
						path: "add",
						loadComponent: () => import("./add-food/add-food.component").then((m) => m.AddFoodComponent),
						canActivate: [loggedInGuard]
					},
					{
						path: "add/:foodId",
						loadComponent: () => import("./add-food/add-food.component").then((m) => m.AddFoodComponent),
						canActivate: [loggedInGuard]
					}
				]
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
						path: "settings",
						loadComponent: () => import("./user-profile/settings/settings.component").then((m) => m.SettingsComponent),
						resolve: { settingsProfile: settingsProfileResolver, userProfile: userProfileResolver }
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
				canActivate: [loggedInGuard, isAdminGuard],
				children: [
					{
						path: "",
						loadComponent: () => import("./admin-dashboard/admin-menu/admin-menu.component").then((m) => m.AdminMenuComponent)
					},
					{
						path: "food-list",
						loadComponent: () =>
							import("./admin-dashboard/admin-food-list/admin-food-list.component").then((m) => m.AdminFoodListComponent)
					},
					{
						path: "user-list",
						loadComponent: () =>
							import("./admin-dashboard/admin-user-list/admin-user-list.component").then((m) => m.AdminUserListComponent)
					}
				]
			},
			{
				path: "",
				redirectTo: "dashboard",
				pathMatch: "full"
			}
		]
	},
	{
		path: "not-found",
		loadComponent: () => import("./not-found/not-found.component").then((m) => m.NotFoundComponent)
	},
	{
		path: "acctmgmt",
		loadComponent: () => import("./account-management/account-management.component").then((m) => m.AccountManagementComponent)
	},
	{
		path: "login",
		loadComponent: () => import("./login/login.component").then((m) => m.LoginComponent),
		canActivate: [loggedOutGuard]
	},
	{
		path: "register",
		loadComponent: () => import("./registration/registration.component").then((m) => m.RegistrationComponent),
		canActivate: [loggedOutGuard]
	},
	{
		path: "verify-email",
		loadComponent: () => import("./account-management/verify-email/verify-email.component").then((m) => m.VerifyEmailComponent)
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
