import { isPlatformBrowser } from "@angular/common";
import { Component, inject, OnInit, PLATFORM_ID } from "@angular/core";
import { Analytics } from "@angular/fire/analytics";
import { Performance } from "@angular/fire/performance";
import { MatIconRegistry } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { SwUpdate } from "@angular/service-worker";
import { PwaService } from "./services/pwa.service";
import { filter, map, mergeMap } from "rxjs";

const ICONS = [
	"telegram",
	"cronometer",
	"yazio",
	"croissant",
	"capsules-solid",
	"baby-solid",
	"bottle-droplet-solid",
	"bottle-water-solid",
	"bowl-food-solid",
	"candy-cane-solid",
	"carrot-solid",
	"cow-solid",
	"drumstick-bite-solid",
	"egg-solid",
	"fish-solid",
	"lemon-solid",
	"nut",
	"ramen",
	"spagetti",
	"pepper-hot-solid",
	"pizza-slice-solid",
	"utensils-solid",
	"question-solid",
	"wheat-awn-solid",
	"barcode-solid",
	"barcode-scanner"
];

@Component({
	selector: "app-root",
	imports: [RouterOutlet],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss"
})
export class AppComponent implements OnInit {
	private platformId = inject(PLATFORM_ID);
	private pwaService = inject(PwaService);
	private iconRegistry = inject(MatIconRegistry);
	private snackBar = inject(MatSnackBar);
	private sanitizer = inject(DomSanitizer);
	private swUpdate = inject(SwUpdate);
	private router = inject(Router);
	private activatedRoute = inject(ActivatedRoute);
	private titleService = inject(Title);
	private _analytics = inject(Analytics);
	private _performance = inject(Performance);

	constructor() {
		for (const icon of ICONS) {
			this.iconRegistry.addSvgIcon(icon, this.sanitizer.bypassSecurityTrustResourceUrl(`assets/icons/${icon}.svg`));
		}

		if (isPlatformBrowser(this.platformId)) {
			window.addEventListener("beforeinstallprompt", (event) => {
				event.preventDefault();
				this.pwaService.registerPwaInstallPrompt(event);
			});
		}
	}

	ngOnInit(): void {
		this.router.events
			.pipe(
				filter((event) => event instanceof NavigationEnd),
				map(() => {
					let route = this.activatedRoute;
					while (route.firstChild) route = route.firstChild;
					return route;
				}),
				mergeMap((route) => route.data)
			)
			.subscribe((data) => {
				if (data["title"]) {
					this.titleService.setTitle(`KombuchAI - ${data["title"]}`);
				}
			});

		if (this.swUpdate.isEnabled) {
			this.swUpdate.versionUpdates.subscribe((event) => {
				if (event.type === "VERSION_DETECTED") {
					console.log("New version detected:", event);
				} else if (event.type === "VERSION_READY") {
					console.log("New version is ready to be activated:", event);
					this.showUpdateSnackbar();
				} else if (event.type === "VERSION_INSTALLATION_FAILED") {
					console.error("Version installation failed:", event);
				}
			});
		}
	}

	private showUpdateSnackbar() {
		const snackBarRef = this.snackBar.open("A new version is available!", "Reload", {
			duration: 30_000
		});

		snackBarRef.onAction().subscribe(() => window.location.reload());
	}
}
