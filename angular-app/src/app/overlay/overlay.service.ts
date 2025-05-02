import { GlobalPositionStrategy, Overlay, OverlayConfig, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { inject, Injectable, Injector, Type } from "@angular/core";
import { FullscreenOverlayRef } from "./overlay-ref";
import { FULLSCREEN_OVERLAY_DATA } from "./overlay.token";
import { Location } from "@angular/common";
export interface FullscreenOverlayConfig<D = any> {
	data?: D;
	panelClass?: string | string[];
	backdropClass?: string;
}

@Injectable({
	providedIn: "root"
})
export class OverlayService {
	private overlay = inject(Overlay);
	private injector = inject(Injector);
	private location = inject(Location);
	private activeOverlay: FullscreenOverlayRef<any> | null = null;

	open<T, R = any, D = any>(component: Type<T>, config?: FullscreenOverlayConfig<D>): Promise<FullscreenOverlayRef<T, R>>;
	open<T, R = any, D = any>(
		componentLoader: () => Promise<Type<T>>,
		config?: FullscreenOverlayConfig<D>
	): Promise<FullscreenOverlayRef<T, R>>;

	async open<T, R = any, D = any>(
		componentOrLoader: Type<T> | (() => Promise<Type<T>>),
		config?: FullscreenOverlayConfig<D>
	): Promise<FullscreenOverlayRef<T, R>> {
		let componentTypePromise: Promise<Type<T>>;

		if (
			typeof componentOrLoader === "function" &&
			!(componentOrLoader.prototype && componentOrLoader.prototype.constructor === componentOrLoader)
		) {
			componentTypePromise = (componentOrLoader as () => Promise<Type<T>>)();
		} else if (typeof componentOrLoader === "function") {
			componentTypePromise = Promise.resolve(componentOrLoader as Type<T>);
		} else {
			return Promise.reject(new Error("Invalid argument: Must provide a Component type or a loader function."));
		}

		const componentType = await componentTypePromise;
		const positionStrategy: GlobalPositionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();
		const overlayConfig = new OverlayConfig({
			positionStrategy,
			hasBackdrop: true,
			width: "100vw",
			height: "100vh",
			scrollStrategy: this.overlay.scrollStrategies.block(),
			panelClass: [
				"fullscreen-overlay-pane",
				...(Array.isArray(config?.panelClass) ? config.panelClass : [config?.panelClass || ""])
			],
			backdropClass: config?.backdropClass || "cdk-overlay-dark-backdrop"
		});

		const cdkOverlayRef: OverlayRef = this.overlay.create(overlayConfig);
		const fullscreenOverlayRef = new FullscreenOverlayRef<T, R>(cdkOverlayRef);
		const customInjector = Injector.create({
			providers: [
				{ provide: FullscreenOverlayRef, useValue: fullscreenOverlayRef },
				{ provide: FULLSCREEN_OVERLAY_DATA, useValue: config?.data }
			],
			parent: this.injector
		});
		const portal = new ComponentPortal(componentType, null, customInjector);
		const componentRef = cdkOverlayRef.attach(portal);
		fullscreenOverlayRef.componentInstance = componentRef.instance;

		this.activeOverlay = fullscreenOverlayRef;
		window.history.pushState(null, "", `${window.location.pathname}#`);
		this.listenForBackButton();

		return fullscreenOverlayRef;
	}

	private listenForBackButton(): void {
		const backButtonHandler = () => {
			if (this.activeOverlay) {
				this.activeOverlay.close();
				this.location.replaceState(window.location.pathname);
			}
		};

		window.addEventListener("popstate", backButtonHandler);

		if (this.activeOverlay) {
			this.activeOverlay.afterClosed$.subscribe(() => {
				window.removeEventListener("popstate", backButtonHandler);
				this.activeOverlay = null;
			});
		}
	}
}
