import { provideHttpClient, withFetch } from "@angular/common/http";
import { ApplicationConfig, inject, isDevMode, provideExperimentalZonelessChangeDetection } from "@angular/core";
import { FirebaseApp } from "@angular/fire/app";
import { connectAuthEmulator, getAuth, provideAuth } from "@angular/fire/auth";
import { connectFirestoreEmulator, initializeFirestore, provideFirestore } from "@angular/fire/firestore";
import { connectStorageEmulator, getStorage, provideStorage } from "@angular/fire/storage";
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from "@angular/material/form-field";
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions, withIncrementalHydration } from "@angular/platform-browser";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { PreloadAllModules, provideRouter, withPreloading, withInMemoryScrolling } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { environment } from "../environments/environment";
import { routes } from "./app.routes";
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from "@angular/material/snack-bar";

export const appConfig: ApplicationConfig = {
	providers: [
		provideHttpClient(withFetch()),
		provideExperimentalZonelessChangeDetection(),
		provideRouter(routes, withPreloading(PreloadAllModules), withInMemoryScrolling({ scrollPositionRestoration: "enabled" })),
		provideClientHydration(withHttpTransferCacheOptions({}), withIncrementalHydration(), withEventReplay()),
		provideAnimationsAsync(),
		{
			provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
			useValue: { appearance: "outline" }
		},
		{
			provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
			useValue: { duration: 3000, horizontalPosition: "center", verticalPosition: "bottom" }
		},
		provideFirestore(() => {
			const firestore = initializeFirestore(inject(FirebaseApp), { ignoreUndefinedProperties: true });
			if (!environment.production && !(firestore as any)._settingsFrozen) {
				connectFirestoreEmulator(firestore, "localhost", 8080);
			}

			return firestore;
		}),
		provideAuth(() => {
			const auth = getAuth(inject(FirebaseApp));
			if ((auth as any)._canInitEmulator && !environment.production) {
				connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
			}

			return auth;
		}),
		provideStorage(() => {
			const storage = getStorage();
			if (!environment.production) {
				connectStorageEmulator(storage, "localhost", 9199);
			}

			return storage;
		}),
		provideServiceWorker("ngsw-worker.js", {
			enabled: !isDevMode(),
			registrationStrategy: "registerWhenStable:30000"
		})
	]
};
