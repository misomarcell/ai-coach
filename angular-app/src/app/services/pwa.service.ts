import { isPlatformServer } from "@angular/common";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";

@Injectable({
	providedIn: "root"
})
export class PwaService {
	private platformId = inject(PLATFORM_ID);
	private deferredPrompt: any;
	private isInstalled = false;

	constructor() {
		if (isPlatformServer(this.platformId)) {
			return;
		}

		this.checkPwaInstallation();
	}

	private checkPwaInstallation() {
		if (window.matchMedia("(display-mode: standalone)").matches) {
			this.isInstalled = true;
		}
	}

	public promptInstallPwa() {
		if (this.deferredPrompt) {
			this.deferredPrompt.prompt();
			this.deferredPrompt.userChoice.then((choiceResult: any) => {
				if (choiceResult.outcome === "accepted") {
					this.isInstalled = true;
				}
				this.deferredPrompt = null;
			});
		}
	}

	public isReadyToInstall(): boolean {
		return !!this.deferredPrompt && !this.isInstalled;
	}

	public registerPwaInstallPrompt(event: any) {
		this.deferredPrompt = event;
	}
}
