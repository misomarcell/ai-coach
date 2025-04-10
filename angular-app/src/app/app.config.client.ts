import { ApplicationConfig, mergeApplicationConfig } from "@angular/core";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { environment } from "../environments/environment";
import { appConfig } from "./app.config";
import { provideAnimations } from "@angular/platform-browser/animations";

const config: ApplicationConfig = {
	providers: [provideAnimations(), provideFirebaseApp(() => initializeApp(environment.firebase))]
};

export const clientConfig = mergeApplicationConfig(appConfig, config);
