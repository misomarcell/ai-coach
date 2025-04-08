import { ApplicationConfig, inject, mergeApplicationConfig, REQUEST_CONTEXT } from "@angular/core";
import { initializeServerApp, provideFirebaseApp } from "@angular/fire/app";
import { provideServerRendering } from "@angular/platform-server";
import { provideServerRouting } from "@angular/ssr";
import { environment } from "../environments/environment";
import { appConfig } from "./app.config";
import { serverRoutes } from "./app.routes.server";

const config: ApplicationConfig = {
	providers: [
		provideServerRendering(),
		provideServerRouting(serverRoutes),
		provideFirebaseApp(() => {
			const requestContext = inject(REQUEST_CONTEXT, { optional: true }) as
				| {
						authIdToken: string;
				  }
				| undefined;
			const authIdToken = requestContext?.authIdToken;

			return initializeServerApp(environment.firebase, { authIdToken });
		})
	]
};

export const serverConfig = mergeApplicationConfig(appConfig, config);
