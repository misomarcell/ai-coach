import { GlobalPositionStrategy, Overlay, OverlayConfig, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { inject, Injectable, Injector, Type } from "@angular/core";
import { FullscreenOverlayRef } from "./overlay-ref";
import { FULLSCREEN_OVERLAY_DATA } from "./overlay.token";

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

	/**
	 * Opens a component in a fullscreen overlay.
	 * @param componentLoader A function that returns a promise resolving to the component type (for lazy loading).
	 * @param config Optional configuration for the overlay.
	 * @returns A reference to the opened overlay.
	 */
	async open<T, R = any, D = any>(
		componentLoader: () => Promise<Type<T>>,
		config?: FullscreenOverlayConfig<D>
	): Promise<FullscreenOverlayRef<T, R>> {
		const positionStrategy: GlobalPositionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();
		const overlayConfig = new OverlayConfig({
			positionStrategy,
			hasBackdrop: true,
			width: "100vw",
			height: "100vh",
			maxWidth: "100vw",
			maxHeight: "100vh",
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
		const componentType = await componentLoader();
		const portal = new ComponentPortal(componentType, null, customInjector);
		const componentRef = cdkOverlayRef.attach(portal);
		fullscreenOverlayRef.componentInstance = componentRef.instance;

		return fullscreenOverlayRef;
	}
}
