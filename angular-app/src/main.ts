import { enableProdMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { clientConfig } from "./app/app.config.client";
import { environment } from "./environments/environment";

if (environment.production) {
	enableProdMode();
}

bootstrapApplication(AppComponent, clientConfig).catch((err) => console.error(err));
